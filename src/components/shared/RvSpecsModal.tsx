import * as Dialog from '@radix-ui/react-dialog'
import { Truck, X } from 'lucide-react'

const RV_SPECS = [
  { label: 'אורך', metric: '7.6 מ׳', imperial: '25 ft' },
  { label: 'רוחב', metric: '2.5 מ׳', imperial: '8 ft' },
  { label: 'גובה', metric: '3.4 מ׳', imperial: '11 ft' },
  { label: 'משקל כולל', metric: '6,350 ק"ג', imperial: '14,000 lbs' },
  { label: 'מיכל דלק', metric: '208 ליטר', imperial: '55 gal' },
  { label: 'ישנים', metric: '6', imperial: '' },
  { label: 'גנרטור', metric: 'כן', imperial: '' },
  { label: 'דגם', metric: 'Cruise America Class C', imperial: '' },
]

export function RvSpecsModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-2 rounded-apple px-3 py-2 text-subhead text-apple-secondary hover:bg-black/[0.04] transition-colors"
          title="מידות הקרוואן"
        >
          <Truck className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm glass-float rounded-apple-xl p-5 shadow-glass-float"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-title text-apple-primary flex items-center gap-2">
              <Truck className="h-6 w-6 text-ios-blue" />
              מידות הקרוואן
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-full hover:bg-black/[0.04]">
                <X className="h-5 w-5 text-apple-secondary" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3">
            {RV_SPECS.map((spec) => (
              <div key={spec.label} className="flex items-center justify-between">
                <span className="text-body text-apple-secondary">{spec.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-body text-apple-primary font-medium">{spec.metric}</span>
                  {spec.imperial && (
                    <span className="text-caption text-apple-tertiary">({spec.imperial})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-apple bg-ios-orange/5 border border-ios-orange/10">
            <p className="text-caption text-ios-orange">
              ⚠️ שימו לב לגובה 3.4 מ׳ (11 ft) — בדקו גובה גשרים ומנהרות!
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
