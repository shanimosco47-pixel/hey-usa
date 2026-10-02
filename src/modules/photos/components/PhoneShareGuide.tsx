import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Copy, Smartphone, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'
import { getFamilyMember } from '@/constants'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const INBOX_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/photo-inbox` : ''

type Platform = 'iphone' | 'android'

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the value is selectable as a fallback
    }
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-apple-secondary">{label}</p>
      <div className="flex items-center gap-2">
        <code
          dir="ltr"
          className="min-w-0 flex-1 select-all truncate rounded-apple-sm bg-black/[0.04] px-2 py-1.5 text-left text-xs text-apple-primary"
        >
          {value}
        </code>
        <button
          onClick={copy}
          className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-apple-sm bg-ios-blue px-2.5 text-xs font-medium text-white"
          aria-label={`העתק ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'הועתק' : 'העתק'}
        </button>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-blue/10 text-xs font-bold text-ios-blue">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-sm text-apple-primary">{children}</div>
    </li>
  )
}

/** Action names stay in English: they are what iOS search finds in any language. */
function Action({ children }: { children: string }) {
  return (
    <span dir="ltr" className="rounded bg-black/[0.05] px-1 font-medium">
      {children}
    </span>
  )
}

export function PhoneShareGuide() {
  const { currentMember } = useAuth()
  const [platform, setPlatform] = useState<Platform>(() =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iphone' : 'android',
  )
  // Moti is the bot, not a photographer
  const member = currentMember && currentMember !== 'moti' ? currentMember : 'aba'
  const memberName = getFamilyMember(member)?.name ?? member

  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex items-center gap-1.5 text-xs font-medium text-ios-blue">
        <Smartphone className="h-3.5 w-3.5" />
        העלאה ישירה מהגלריה (שיתוף)
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed inset-x-4 top-[50%] z-50 mx-auto max-h-[85vh] max-w-lg translate-y-[-50%] overflow-y-auto rounded-apple-lg border border-black/[0.06] bg-surface-primary p-5 shadow-glass-float focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-headline font-bold text-apple-primary">
              שיתוף תמונות מהגלריה
            </Dialog.Title>
            <Dialog.Close
              className="rounded-apple-sm p-1.5 text-apple-secondary hover:bg-black/[0.04]"
              aria-label="סגירה"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-apple-secondary">
            בוחרים תמונות בגלריה, לוחצים שיתוף, והן נכנסות לאלבום של הטיול, כל אחת ליום שבו צולמה.
          </Dialog.Description>

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-apple bg-black/[0.04] p-1">
            {(['iphone', 'android'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  'min-h-[36px] rounded-apple-sm text-sm font-medium',
                  platform === p ? 'bg-white text-apple-primary shadow-sm' : 'text-apple-secondary',
                )}
              >
                {p === 'iphone' ? 'אייפון' : 'אנדרואיד'}
              </button>
            ))}
          </div>

          {platform === 'android' ? (
            <>
              <ol className="space-y-4">
                <Step n={1}>
                  <p>
                    פותחים את האפליקציה ב-Chrome, תפריט ⋮ ואז <b>הוספה למסך הבית</b> (או{' '}
                    <b>התקנת אפליקציה</b>). פעם אחת בלבד.
                  </p>
                </Step>
                <Step n={2}>
                  <p>
                    בגלריה בוחרים תמונות, לוחצים <b>שיתוף</b> ובוחרים <b>Hey USA</b>. האפליקציה
                    תיפתח ותעלה אותן.
                  </p>
                </Step>
              </ol>
              <p className="mt-4 text-xs text-apple-secondary">
                לא רואים את Hey USA ברשימת השיתוף? פתחו את האפליקציה פעם אחת ממסך הבית, ונסו שוב.
              </p>
            </>
          ) : !INBOX_URL || !SUPABASE_KEY ? (
            <p className="text-sm text-ios-red">
              שיתוף מאייפון דורש חיבור לשרת, והאפליקציה פועלת כרגע במצב מקומי בלבד.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-apple-secondary">
                אייפון לא מאפשר לאתרים להופיע בתפריט השיתוף, לכן בונים פעם אחת קיצור דרך (Shortcut)
                באפליקציית <b>קיצורים</b>. לוקח כ-3 דקות.
              </p>
              <ol className="space-y-4">
                <Step n={1}>
                  <p>
                    באפליקציית קיצורים לוחצים <b>+</b>, נותנים שם <b>Hey USA</b>. בהגדרות הקיצור (ⓘ)
                    מפעילים <b>הצג בגיליון השיתוף</b> ובוחרים קלט מסוג <b>תמונות</b>.
                  </p>
                </Step>
                <Step n={2}>
                  <p>
                    מוסיפים <Action>Repeat with Each</Action> על <b>קלט קיצור הדרך</b>.
                  </p>
                </Step>
                <Step n={3}>
                  <p>
                    בתוך הלולאה מוסיפים <Action>Convert Image</Action>: פורמט <b>JPEG</b>, איכות
                    60%, ו<b>שמירת מטא-דאטה</b> פעיל (כך נשמרים התאריך והמיקום).
                  </p>
                </Step>
                <Step n={4}>
                  <p>
                    בתוך הלולאה מוסיפים <Action>Get Contents of URL</Action> עם הכתובת:
                  </p>
                  <CopyField label="כתובת" value={INBOX_URL} />
                  <p>
                    שיטה <b>POST</b>. תחת <b>כותרות</b> מוסיפים מפתח <b dir="ltr">apikey</b> עם
                    הערך:
                  </p>
                  <CopyField label="apikey" value={SUPABASE_KEY} />
                  <p>
                    גוף הבקשה <b>טופס</b>, עם שני שדות: <b dir="ltr">photo</b> מסוג קובץ = התמונה
                    שהומרה, ו-<b dir="ltr">member</b> מסוג טקסט =
                  </p>
                  <CopyField label={`member (${memberName})`} value={member} />
                </Step>
                <Step n={5}>
                  <p>
                    אחרי הלולאה (לא חובה) מוסיפים <Action>Show Notification</Action> עם הטקסט
                    ״התמונות הועלו ל-Hey USA״.
                  </p>
                </Step>
              </ol>
              <p className="mt-4 text-xs text-apple-secondary">
                מעכשיו: תמונות, בוחרים, שיתוף, Hey USA. כל אחד במשפחה בונה את הקיצור בטלפון שלו,
                מתוך האפליקציה כשהוא מחובר בשמו, כדי שהערך של member יהיה שלו.
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
