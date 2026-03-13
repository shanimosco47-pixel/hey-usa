import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    const shareData = {
      title: 'Hey USA - מתכננים טיול',
      text: 'בואו לראות את תכנון הטיול שלנו!',
      url,
    }

    // Use native Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Last resort: prompt-based fallback
      window.prompt('העתיקו את הקישור:', url)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        'flex items-center justify-center rounded-full p-1.5 transition-colors',
        'hover:bg-sand-dark/40 active:bg-sand-dark/60',
        copied && 'text-green-600',
      )}
      title={copied ? 'הקישור הועתק!' : 'שיתוף קישור'}
      aria-label={copied ? 'הקישור הועתק' : 'שיתוף קישור'}
    >
      {copied ? (
        <Check className="h-5 w-5" />
      ) : navigator.share ? (
        <Share2 className="h-5 w-5 text-brown" />
      ) : (
        <Copy className="h-5 w-5 text-brown" />
      )}
    </button>
  )
}
