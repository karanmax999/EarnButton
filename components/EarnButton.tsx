'use client'

import React from 'react'
import clsx from 'clsx'

/**
 * Props for the EarnButton component
 */
export interface EarnButtonProps {
  /** Whether the button is disabled (e.g., wallet not connected) */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Callback to open the deposit modal */
  onOpenModal: () => void
}

/**
 * EarnButton - Primary call-to-action button for opening the deposit modal.
 *
 * Displays a green gradient pill-shaped button with "Earn with YO" text.
 * Disabled when wallet is not connected.
 *
 * Requirements: 1.4, 1.5
 */
const EarnButton: React.FC<EarnButtonProps> = ({
  disabled = false,
  className,
  onOpenModal,
}) => {
  return (
    <button
      type="button"
      onClick={onOpenModal}
      disabled={disabled}
      aria-disabled={disabled}
      className={clsx(
        // Base layout
        'inline-flex items-center justify-center gap-2',
        'px-8 py-3 rounded-full',
        // Typography
        'text-base font-semibold text-white',
        // Gradient background
        'bg-gradient-to-r from-primary-500 to-success-500',
        // Shadow
        'shadow-medium',
        // Transitions
        'transition-all duration-200 ease-in-out',
        // Enabled states
        !disabled && [
          'hover:from-primary-400 hover:to-success-400',
          'hover:shadow-strong hover:-translate-y-0.5',
          'active:from-primary-600 active:to-success-600',
          'active:shadow-soft active:translate-y-0',
          'cursor-pointer',
        ],
        // Disabled state
        disabled && [
          'opacity-50 cursor-not-allowed',
          'from-neutral-400 to-neutral-500',
          'shadow-none',
        ],
        className,
      )}
    >
      {/* EarnButton logo mark */}
      <span
        className={clsx(
          'inline-flex items-center justify-center',
          'w-6 h-6 rounded-full text-xs font-bold',
          'bg-white/20 border border-white/30',
        )}
        aria-hidden="true"
      >
        eB
      </span>

      <span>Earn with YO</span>
    </button>
  )
}

export default EarnButton
