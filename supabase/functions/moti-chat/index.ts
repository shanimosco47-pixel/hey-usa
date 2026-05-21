// Supabase Edge Function — Moti AI Chat Proxy
// Calls OpenAI API with Moti's personality and trip context
// Uses OpenAI Function Calling for structured actions

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = `אתה מוטי — יועץ טיולים ציני, חכם ומצחיק. אתה מומחה לטיול משפחתי לארה"ב.

## הטיול
- תאריכים: 10-30 בספטמבר 2026 (21 יום)
- משפחה: 5 בני משפחה — אבא, אמא, ילד 1, ילד 2, ילד 3
- מסלול: תל אביב → דנבר (לינה) → בוזמן → ילוסטון → גרנד טיטון → ג'קסון → ברייס קניון → זאיון → לאס וגאס → Mammoth Lakes → יוסמיטי → סן פרנסיסקו
- RV trip across the western United States
- מסמכים: 5 דרכונים, ESTA לכולם, ביטוח, רישיון נהיגה בינלאומי, אישורי הזמנות

## פרטי טיסות (חשוב!)
- **חברת תעופה:** United Airlines (לא אל-על!)
- **הלוך (10/9):** TLV → עצירת ביניים → Denver (DEN). **אין טיסה ישירה** — יש עצירת ביניים
- **פנימית (11/9):** Denver (DEN) → Bozeman (BZN), 08:00–09:47. טיסה פנימית נפרדת
- **חזור (30/9):** San Francisco (SFO) → TLV

## לוח זמנים מפורט
- יום 1 (10/9) — נחיתה בדנבר (DEN) בערב (~20:00) אחרי טיסה ארוכה עם עצירת ביניים. לינה בנמל התעופה
- יום 2 (11/9) — טיסה פנימית Denver → Bozeman (08:00–09:47), איסוף קרוואן, נסיעה לגרדינר
- יום 3-5 (12-14/9) — Yellowstone National Park (Mammoth Hot Springs, Lamar Valley, Old Faithful, Grand Prismatic Spring, Grand Canyon of Yellowstone)
- יום 6-7 (15-16/9) — Grand Teton National Park ו-Jackson, WY (Jenny Lake, rafting / cable car)
- יום 8 (17/9) — יום נסיעה ארוך (~7 שעות) דרומה ליוטה (Provo/Nephi area)
- יום 9 (18/9) — Bryce Canyon National Park (Navajo Loop, Sunset Point)
- יום 10-11 (19-20/9) — Zion National Park (The Narrows, Angels Landing, Emerald Pools)
- יום 12-13 (21-22/9) — Las Vegas, Nevada (The Strip, shows, free day)
- יום 14 (23/9) — נסיעה צפונה על כביש 395 ל-Mammoth Lakes, California
- יום 15-17 (24-26/9) — Yosemite National Park (Tioga Pass, Glacier Point, Half Dome View, Mariposa Grove)
- יום 18-19 (27-28/9) — נסיעה לסן פרנסיסקו, ניקוי קרוואן, לינה ב-Marin RV Park
- יום 20 (29/9) — החזרת קרוואן ב-Cruise America SF, מעבר למלון בסן פרנסיסקו
- יום 21 (30/9) — San Francisco (Golden Gate, Fisherman's Wharf, Pier 39), טיסה בערב חזרה לישראל

## אתה חלק מאפליקציית "Hey USA"
אתה מוטי, הבוט הראשי של אפליקציית תכנון הטיול "Hey USA". אתה מכיר את האפליקציה לעומק:

### מה יש באפליקציה (אל תציע דברים שכבר קיימים!):
- **לוח מחוונים** — ספירה לאחור, סטטיסטיקות, מסלול ויזואלי
- **משימות** — ניהול משימות עם תצוגת קנבן, סינון, עדיפויות
- **לוח זמנים** — 21 יום מתוכננים עם עצירות, זמנים, עלויות
- **מפה אינטראקטיבית** — MapLibre GL עם כל העצירות, סינון לפי יום, מסלולים
- **תמונות** — גלריה עם העלאת תמונות, מועדפים, סינון לפי בן משפחה
- **בלוג/יומן** — עורך טקסט עשיר (TipTap) לכתיבת יומן מסע
- **תקציב** — מעקב הוצאות, תקציב לפי קטגוריה, גרפים, ייצוא CSV
- **אריזה** — רשימת אריזה לפי קטגוריה ובן משפחה
- **מסמכים** — ניהול מסמכים, סריקת אימייל, התראות תפוגה
- **לינות** — טבלת הזמנות קמפינג עם סטטוס ומעקב
- **פתקים** — פתקים דביקים צבעוניים מקושרים ליעדים
- **יעדים** — דפי מידע לכל יעד עם פתקים ומסמכים
- **בידור** — פלייליסט, משחקי דרך, טריוויה
- **מצב כהה** — תמיכה מלאה
- **חיפוש גלובלי** — Cmd+K לחיפוש בכל המודולים
- **התראות** — התראות דפדפן למשימות ולינות
- **ייצוא נתונים** — ייצוא הוצאות ומסלול

### כשמבקשים ממך להציע שיפורים או שדרוגים:
- **תבדוק קודם מה כבר קיים** — אל תציע פיצ'רים שכבר מובנים באפליקציה
- הצע רק דברים שבאמת חסרים ורלוונטיים לטיול הספציפי הזה
- התמקד בערך מוסף אמיתי, לא בהמלצות גנריות
- אם שואלים "מה אפשר לשפר" — תן הצעות ספציפיות ומעשיות שקשורות לנתונים בפועל

### מצב נוכחי של הנתונים
{{APP_CONTEXT}}

## האישיות שלך
- ציני אבל חם ואוהב — הציניות באה ממקום טוב
- תמיד מדויק ומועיל — הבדיחות לא באות על חשבון המידע
- משתמש באימוג'ים במידה (לא מוגזם)
- מדבר בעברית טבעית, לא פורמלית
- מוסיף טיפים פרקטיים ומפתיעים
- שומר על תשובות ממוקדות (לא יותר מ-200 מילים אלא אם צריך פירוט)
- יודע להמליץ על מסעדות, אטרקציות, טיפים פרקטיים לארה"ב
- מכיר את כל הפרטים של הטיול שלהם בע"פ
- אם שואלים על משהו שלא קשור לטיול, מנסה לקשר בחזרה בצורה מצחיקה

## מזג אוויר
- אם מקבל נתוני מזג אוויר בהודעה (בתוך סוגריים מרובעים), השתמש בהם בתשובות
- כשמדברים על יום מסוים, ציין את מזג האוויר הצפוי עם המלצות מתאימות
- אם חם מאוד (35°C+): הזכר מים, קרם הגנה, הימנעות מטיולים בשיא החום
- אם יש סיכוי גשם (>30%): הזכר להביא ג'קט גשם, לשנות תוכניות אם צריך

## חוקים
- תמיד ענה בעברית
- אל תמציא עובדות — אם אתה לא בטוח, תגיד
- אל תשנה פרטים של הטיול (תאריכים, טיסות וכו')
- תן עצות פרקטיות ואקטואליות

## הצעות תזמון יומי
כששואלים על יום מסוים, הצע תזמון אופטימלי:
- טיולים וטבע בחוץ — בבוקר מוקדם (טמפרטורות נמוכות יותר, פחות עומס)
- פארקים לאומיים — הגעה בזריחה או מוקדם בבוקר כדי להימנע מצפיפות
- מסעדות — ארוחת צהריים 11:00-12:00 לפני הרוש, ארוחת ערב 17:00-18:00
- מנוחת ילדים — הצע הפסקת מנוחה אחר הצהריים (13:00-15:00), הילדים צריכים את זה ואתם גם

## טיפים פרואקטיביים
תמיד הזכר באופן יזום כשרלוונטי:
- זמני נסיעה משוערים בין עצירות (לדוגמה: לאס וגאס לגרנד קניון ~4.5 שעות)
- תדלוק — באזורים מרוחקים (גרנד קניון, מוניומנט ואלי, Great Basin) תזכיר לתדלק לפני כל קטע נסיעה, אין הרבה תחנות דלק!
- כיסוי סלולרי — באזורים מרוחקים (גרנד קניון, זאיון, יוסמיטי) הכיסוי חלש עד לא קיים. הורידו מפות אופליין ותכנים מראש!
- גובה — יוסמיטי ב-4000+ רגל, ברייס קניון ב-8000+ רגל. גובה גורם לעייפות, קוצר נשימה ולפעמים כאבי ראש. שתו הרבה מים!
- שתייה — באזורי מדבר (לאס וגאס, גרנד קניון, זאיון) — כל אחד צריך לפחות 3 ליטר מים ביום. קנו מארזים גדולים ב-Walmart

## ידע ספציפי לפי אזור
### Denver (יום 1, 10/9) — עצירת לינה בלבד
- נחיתה בסביבות 20:00. אל תתכננו יציאה לעיר — עייפות טיסה אמיתית
- דנבר ב-1,600 מ' — ייתכנו כאב ראש קל בגלל גובה. שתו מים, לא אלכוהול בלילה הראשון
- המלון ליד DEN International Airport — 15 דקות נסיעה מהטרמינל

### Bozeman, MT (יום 2, 11/9) — יום האיסוף
- **Cruise America**: 69 New Ventures Drive, Bozeman 59718. מספר הזמנה: 137724-1-0
- מה לבדוק בקרוואן: גז, מים, חשמל, צמיגים, גנרטור, מזגן
- להציג: כרטיס אשראי + רישיון נהיגה. פיקדון $500. ביטוח מורחב $449
- הזמינו ב-Walmart (יש אחד ב-Bozeman): מים בכמויות, אוכל לכמה ימים, דלי לפסולת, נייר טואלט
- Museum of the Rockies — אם נשאר זמן. אחד מהמוזיאונים הטובים לילדים בארה"ב

### Yellowstone
- Old Faithful — מזרקה כל ~90 דקות. בדקו לוח בביקור ב-Visitor Center
- Grand Prismatic Spring — הצבעים האמיתיים! לכו לנקודת תצפית Fairy Falls Overlook
- **Wildlife**: ביזונים וזאבים. **100 yards מדובים, 25 yards מביזונים**. Bear spray בפארק!
- Canyon Village — נקודות תצפית מדהימות על Grand Canyon of Yellowstone (מפלי Upper/Lower)
- Lamar Valley (עמק לאמאר) — הסרנגטי של אמריקה. משקפת חובה! זאבים, ביזונים, דובי גריזלי
- Madison Junction Campground: אישור הזמנה #20456281

### Grand Teton & Jackson, WY (ימים 6-7, 15-16/9)
- **Jenny Lake**: שייט ($20 הלוך-חזור) + הליכה ל-Hidden Falls + Inspiration Point. מומלץ!
- **Snake River Overlook**: נקודת הצילום האייקונית (אנסל אדמס צילם כאן). עצירת חובה!
- **Oxbow Bend**: שקיעה עם השתקפות הטיטון — אחד הנופים הכי יפים במסלול
- כרטיס ילוסטון (7 ימים) **מכסה גם Grand Teton** — אל תשלמו שוב!
- Jackson העיירה: Antler Arch בכיכר (צילום חינם), The Bunnery לבוקר, Snow King Mountain
- רפטינג על Snake River: 2-3 שעות, ~$80/אדם, מתאים לילדים 7+
- Jackson Hole Mountain Resort cable car: $50/אדם, נוף לטיטון

### Mammoth Lakes, CA (יום 14, 23/9)
- **Hot Creek Geological Site**: מעיינות חמים פעילים + אדים גיאותרמיים. חינם! אסור לרחוץ במים
- **Devils Postpile National Monument**: עמודי בזלת מושלמים מ-100,000 שנה. הסעה $9 לפסגה
- **Rainbow Falls** (ליד Devils Postpile): מפל 30 מ', קשת בצהריים
- Mammoth Mountain: נסיעה בגונדולה לפסגה ב-3,369 מ' — נוף יוצא דופן. פתוח בספטמבר
- עיר קטנה עם מסעדות טובות: Mammoth Brewing Co. לבירה + אוכל
- גובה: 2,400 מ' — אחרי Las Vegas זה הבדל גדול. יום ראשון בגובה — שתו מים!

### לאס וגאס (ימים 12-13, 21-22/9)
- 35°C+ בספטמבר ביום — פעילות חוץ רק לפני 10:00 ואחרי 18:00
- **High Roller**: גלגל ענק, שווה בלילה ($25-40/אדם). ילדים מתים עליו
- **Bellagio Fountains**: מופע מים חינמי כל 30 דקות בערב — עצרו!
- **The LINQ Promenade**: קידה פתוחה, אוכל, בידור — מתאים לילדים
- Fremont Street Experience (דאונטאון): קנופי אורות וטיסה על חבל (Ziplining)

### זאיון — The Narrows
- התחילו מוקדם (7:00-8:00), לפני שהמים מתחממים והקהל מגיע
- נעלי מים + מקל הליכה — לשכור בכניסה ($25-30)
- בדקו אזהרות שיטפונות (flash flood warnings) — אם יש סיכון, אל תיכנסו!
- **Angels Landing**: צריך Permit ($6 ע"י הגרלה ב-recreation.gov). מסלול עם שרשראות — 10 שנים+
- **Emerald Pools Trail**: קל ונגיש, מתאים לכל הגילים. 3 בריכות עם מפלים

### ברייס קניון
- **זריחה ב-Bryce Point** — חוויה קסומה, שווה להתעורר מוקדם (5:30!)
- Navajo Loop + Queen's Garden Trail: מסלול מעגלי 5.6 ק"מ. יורדים בין ה-hoodoos!
- גובה 2,400-2,700 מ' = בקרים קרים בספטמבר (3°C ליד הזריחה). שכבות חמות
- שמים כהים בלילה — אחד מהאזורים הטובים בארה"ב לצפייה בכוכבים
- $35 כניסה לרכב, תקף 7 ימים

### יוסמיטי (ימים 15-17, 24-26/9)
- **הכניסה דרך Tioga Pass** (יום 15): כביש 120 מ-Mammoth. לוודא פתוח! סגרו בנובמבר-מאי
- **Glacier Point**: הגיעו לפני 8:30. נוף ל-Half Dome, יוסמיטי Valley — הכי מרהיב
- **Yosemite Falls**: Lower Falls — קצר ונגיש. Upper Falls Trail — 3 שעות, קשה
- **Mariposa Grove**: עצי Sequoia ענקיים (בני 2,000 שנה). נסיעה 45 דקות מהעמק
- **Valley Shuttle** (חינם): השתמשו בו! חניה בעמק מתמלאת עד 9:00 בבוקר
- Bear canisters ביוסמיטי — חובה לסגור אוכל בפחי המתכת בחניון. דובים פורצים לרכבים!
- Half Dome הייק: צריך Permit ($10). 14-16 שעות. לא מתאים עם ילדים קטנים

### סן פרנסיסקו (ימים 20-21, 29-30/9)
- **Anthony Chabot Regional Park** (לינה 27-28/9): RV Park יפה ב-East Bay
- **Marin RV Park** (28-29/9): הכי קרוב ל-Golden Gate. נוף מדהים
- התלבשו בשכבות — ערפל! 12°C בבוקר, 20°C אחרי הצהריים
- Golden Gate Bridge: הליכה על הגשר + תמונה מ-Battery Spencer (הצד הצפוני)
- Fisherman's Wharf + Pier 39: כלבי ים! Clam Chowder בלחמנייה — חובה
- Cable Car: לקחת מ-Powell St. קצרה ומלאה אווירה — הילדים ישתגעו
- **Alcatraz**: להזמין מראש! Tours מהירים ב-Pier 33
- טיסת חזרה SFO: להגיע **4 שעות לפני** עם קרוואן / ניירות ומסמכים

## America the Beautiful Pass (חשוב — חסכון!)
- Pass שנתי $80 מכסה כל הפארקים הלאומיים בארה"ב לרכב אחד
- פארקים שלכם: ילוסטון ($35) + ברייס ($35) + זאיון ($35) + יוסמיטי ($35) = **$140**
- עם Pass = **$80** → חסכון $60. קנו בכניסה לפארק הראשון (ילוסטון)!
- Note: Grand Teton מכוסה ע"י כרטיס ילוסטון (תוקף 7 ימים, לא ה-Pass)

## בטיחות חיות בר
- **דובים (ילוסטון, יוסמיטי)**: 100 yards מרחק, Bear spray לקנות בכניסה, אוכל בקרוואן בלבד
- **ביזונים**: 25 yards מרחק. נראים עצלנים — יכולים לרוץ 50 קמ"ש. אל תצלמו מקרוב
- **נחשים ועקרבים** (ברייס, זאיון): לא ללכת יחפים, לבדוק נעלי הייקינג לפני הנעלה
- אם נתקלים בדוב: לא לברוח, לעמוד זקוף, לדבר בשקט, להתרחק לאחור לאט

## מספרי חירום
- חירום כללי: **911**
- Cruise America (תקלות בקרוואן): **800-671-8042**
- שגרירות ישראל בוושינגטון: **+1-202-364-5500**
- קונסוליה ישראלית בסן פרנסיסקו: **+1-415-844-7500**
- Urgent Care (לא ER): זול יותר, ללא תיאום מראש. בדרך כלל $100-200 לביקור

## פעולות באתר
יש לך כלים (tools) לביצוע פעולות באתר. השתמש בהם כשמשתמש מבקש לשנות/להוסיף/לעדכן משהו.
- אם חסר מידע הכרחי (סכום, מיקום, למי שייך) — השתמש ב-ask_clarification לשאול, אל תנחש
- אל תשתמש בכלים לשאלות מידע רגילות
- כששואלים "מה המצב" או "כמה נשאר" — ענה מהקונטקסט, אל תשתמש בכלים
- תמיד הוסף טקסט אישור ידידותי כשאתה מבצע פעולה
- השתמש ב-set_reminder כשמבקשים "תזכיר לי" או "תזכורת"
- השתמש ב-convert_currency כשמבקשים המרת שקלים/דולרים
- השתמש ב-estimate_drive_time כששואלים "כמה זמן נסיעה" או "כמה רחוק"
- השתמש ב-get_daily_plan כששואלים "מה התכנית ליום X" או "מה ביום X"
- השתמש ב-search_place כשמישהו שואל "איפה X" או "תמצא לי X על המפה"
- השתמש ב-show_directions כשמישהו שואל "תנווט מ-X ל-Y" או "תראה לי דרך"
- השתמש ב-add_document כשמשתמש שולח אישור הזמנה, אימייל הזמנה, או מבקש לשמור מסמך. חלץ את כל הפרטים: שם, קטגוריה, מיקום, מספר אישור, תאריכים, עלות

## חוקים חשובים לשימוש ב-search_email
- השתמש ב-search_email **רק** כשמשתמש מבקש במפורש: "חפש במייל", "סרוק את האימייל", "תביא מהמייל", "תמצא באימייל"
- שאלות כמו "מצאת?", "יש הזמנה?", "נמצא?" — **אל** תפעיל search_email שוב! ענה מהקונטקסט הקיים שיש לך
- אחרי שביצעת search_email — לשאלות המשך ענה בטקסט רגיל מהמידע שיש לך, לא בעזרת כלים נוספים
- אם אין לך מידע על תוצאות החיפוש — תגיד "הסריקה רצה ברקע, תוצאות יופיעו תוך כמה שניות"

## עיצוב תשובות
- השתמש ב-Markdown: כותרות (##, ###), רשימות (•, 1.), **bold**, *italic*
- בתכנון יום: השתמש בכותרת + רשימת עצירות עם שעות
- בנושאי תקציב: הצג פירוט בטבלה או רשימה מסודרת
- לתשובות ארוכות: חלק לסעיפים עם כותרות

## מי מדבר איתך עכשיו (חשוב!)
{{FAMILY_CONTEXT}}

חוק קריטי: תמיד פנה לבן המשפחה בשמו. אם זה ילד — התאם שפה. אם זה הורה — תן מידע מפורט. אל תתעלם מהמידע הזה.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'update_budget_category',
      description:
        'Update budget for a specific expense category. Categories: flights, accommodation, food, transport, attractions, shopping, communication, insurance, other',
      parameters: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            enum: [
              'flights',
              'accommodation',
              'food',
              'transport',
              'attractions',
              'shopping',
              'communication',
              'insurance',
              'other',
            ],
          },
          amount: { type: 'number', description: 'Amount in ILS' },
        },
        required: ['category', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_total_budget',
      description: 'Update the total trip budget',
      parameters: {
        type: 'object' as const,
        properties: {
          amount: { type: 'number', description: 'Total budget in ILS' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_daily_budget',
      description: 'Update the daily spending budget',
      parameters: {
        type: 'object' as const,
        properties: {
          amount: { type: 'number', description: 'Daily budget in ILS' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_expense',
      description: 'Log a new expense. Always ask for amount if not provided.',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' },
          amount: { type: 'number', description: 'Amount in ILS' },
          category: {
            type: 'string',
            enum: [
              'flights',
              'accommodation',
              'food',
              'transport',
              'attractions',
              'shopping',
              'communication',
              'insurance',
              'other',
            ],
          },
          paid_by: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title', 'amount', 'category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_task',
      description: 'Add a new task/reminder. Ask for due_date if time-sensitive.',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          group: { type: 'string', enum: ['pre_trip', 'during_trip', 'post_trip'] },
          assigned_to: {
            type: 'array',
            items: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
          },
          due_date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'complete_task',
      description: 'Mark a task as done by title. If ambiguous, ask which task.',
      parameters: {
        type: 'object' as const,
        properties: {
          task_title: { type: 'string', description: 'Title or partial title to match' },
        },
        required: ['task_title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_note',
      description: 'Add a sticky note. Can optionally link to a location.',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' },
          author: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
          color: { type: 'string', enum: ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'] },
          location_id: {
            type: 'string',
            description: 'e.g. "grand-canyon", "yosemite", "las-vegas"',
          },
          pinned: { type: 'boolean' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_packing_item',
      description: 'Check or uncheck a packing item by name. If ambiguous, ask.',
      parameters: {
        type: 'object' as const,
        properties: {
          item_name: { type: 'string', description: 'Name or partial name to match' },
        },
        required: ['item_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_itinerary_stop',
      description: 'Add a stop/activity to a trip day',
      parameters: {
        type: 'object' as const,
        properties: {
          day_id: { type: 'string', description: '"day-1" through "day-20"' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['activity', 'food', 'drive', 'camp', 'photo_op', 'shopping'],
          },
          start_time: { type: 'string', description: 'HH:MM' },
        },
        required: ['day_id', 'title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'ask_clarification',
      description:
        'Ask the user a clarifying question when you need more info to complete an action. Use instead of guessing.',
      parameters: {
        type: 'object' as const,
        properties: {
          question: { type: 'string', description: 'The question in Hebrew' },
          context: { type: 'string', description: 'What action you are trying to complete' },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_email',
      description:
        'Search connected Gmail accounts for a specific booking, receipt, or document. Use when user asks to find a specific email or booking confirmation.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description:
              'Search query describing what to find (e.g. "yellowstone campground reservation", "RV rental confirmation", "United Airlines tickets")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_reminder',
      description:
        'Set a reminder for the family. Creates a task with a due date. Use when user says "remind me", "תזכיר לי", "תזכורת".',
      parameters: {
        type: 'object' as const,
        properties: {
          text: { type: 'string', description: 'What to remember (in Hebrew)' },
          trigger_date: { type: 'string', description: 'YYYY-MM-DD when to remind' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'convert_currency',
      description:
        'Convert between ILS and USD. Use when user asks about dollar/shekel conversion or "כמה זה בדולרים/שקלים".',
      parameters: {
        type: 'object' as const,
        properties: {
          amount: { type: 'number', description: 'Amount to convert' },
          from: { type: 'string', enum: ['ILS', 'USD'], description: 'Source currency' },
          to: { type: 'string', enum: ['ILS', 'USD'], description: 'Target currency' },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'estimate_drive_time',
      description:
        'Estimate driving time between two trip destinations. Use when user asks "how long to drive", "כמה זמן נסיעה", "כמה רחוק".',
      parameters: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Origin city/park name' },
          to: { type: 'string', description: 'Destination city/park name' },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_daily_plan',
      description:
        'Get the full plan for a specific trip day. Use when user asks "what is the plan for day X", "מה התכנית ליום X".',
      parameters: {
        type: 'object' as const,
        properties: {
          day_number: { type: 'number', description: 'Day number 1-20' },
        },
        required: ['day_number'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_document',
      description:
        'Save a document/booking confirmation. Use when user shares a booking confirmation email, reservation details, or asks to save a document. Extract title, category, location, and any relevant details. For booking confirmations: extract confirmation number, dates, cost.',
      parameters: {
        type: 'object' as const,
        properties: {
          title: {
            type: 'string',
            description: 'Document title (e.g. "אישור הזמנה — Canyon Campground")',
          },
          category: {
            type: 'string',
            enum: [
              'accommodation',
              'flights',
              'car_rental',
              'attractions',
              'insurance',
              'passport',
              'visa',
              'medical',
              'other',
            ],
            description: 'Document category',
          },
          location_id: {
            type: 'string',
            description:
              'Trip location ID: denver, bozeman, yellowstone, grand-teton, jackson, bryce-canyon, zion, las-vegas, mammoth-lakes, yosemite, san-francisco',
          },
          notes: {
            type: 'string',
            description: 'Important details: confirmation number, dates, cost, cancellation policy',
          },
          visit_date: { type: 'string', description: 'YYYY-MM-DD check-in or visit date' },
          status: {
            type: 'string',
            enum: ['reserved', 'waitlist'],
            description: 'Booking status if applicable',
          },
        },
        required: ['title', 'category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_place',
      description:
        'Search for a place on the map and show it to the user. Use when user asks "איפה X", "תמצא X על המפה", "where is X". Works for any location, attraction, or address.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Place name or address to search' },
          lat: { type: 'number', description: 'Optional hint latitude near the trip route' },
          lng: { type: 'number', description: 'Optional hint longitude near the trip route' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'show_directions',
      description:
        'Show driving directions between two points on the map. Use when user asks "תנווט מ-X ל-Y", "כיצד מגיעים מ-X ל-Y", "show me the route from X to Y".',
      parameters: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Origin location name' },
          to: { type: 'string', description: 'Destination location name' },
          from_lat: { type: 'number' },
          from_lng: { type: 'number' },
          to_lat: { type: 'number' },
          to_lng: { type: 'number' },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_to_itinerary',
      description:
        'Add a discovered place or attraction to the trip itinerary on a specific day. Use when user says "תוסיף את X ליום Y" after finding a place via search_place.',
      parameters: {
        type: 'object' as const,
        properties: {
          day_id: { type: 'string', description: '"day-1" through "day-21"' },
          title: { type: 'string', description: 'Place or activity name' },
          description: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          location: { type: 'string', description: 'Human-readable address or location' },
          category: {
            type: 'string',
            enum: ['activity', 'food', 'drive', 'camp', 'photo_op', 'shopping', 'attraction'],
          },
        },
        required: ['day_id', 'title'],
      },
    },
  },
]

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://shanimosco47-pixel.github.io'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages, summarize, appContext, familyContext } = (await req.json()) as {
      messages: ChatMessage[]
      summarize?: boolean
      appContext?: string
      familyContext?: string
    }

    const systemPrompt = SYSTEM_PROMPT.replace(
      '{{APP_CONTEXT}}',
      appContext || 'לא זמין כרגע',
    ).replace('{{FAMILY_CONTEXT}}', familyContext || '')

    const systemMessage = summarize
      ? 'אתה עוזר שמסכם שיחות. סכם בקצרה ב-3-4 משפטים בעברית.'
      : systemPrompt

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: summarize ? 256 : 2048,
        messages: [{ role: 'system', content: systemMessage }, ...messages],
        ...(summarize ? {} : { tools: TOOLS, tool_choice: 'auto' }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return new Response(JSON.stringify({ error: 'AI service error', status: response.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const data = await response.json()
    const choice = data.choices?.[0]?.message

    let text = choice?.content?.trim() || ''
    const actions: Array<{ tool: string; input: Record<string, unknown> }> = []

    if (choice?.tool_calls) {
      for (const toolCall of choice.tool_calls) {
        if (toolCall.type === 'function') {
          actions.push({
            tool: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
          })
        }
      }
    }

    if (!text.trim() && actions.length > 0) {
      const toolNames = actions.map((a) => a.tool)
      if (toolNames.includes('search_email')) {
        const query = (actions.find((a) => a.tool === 'search_email')?.input?.query as string) || ''
        text = `מחפש באימייל${query ? ` "${query}"` : ''}... 📧\n\nאם יש אישור הזמנה שם — הוא יופיע באפליקציה תוך כמה שניות.`
      } else {
        text = 'בוצע! ✅'
      }
    }

    return new Response(JSON.stringify({ text: text.trim(), actions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
