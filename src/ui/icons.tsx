// Small inline icons matching the Figma cards (stroke, 16px).

type P = { size?: number }

const svg = (size: number, children: React.ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const EyeIcon = ({ size = 16 }: P) =>
  svg(size, <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>)

export const ChevronDownIcon = ({ size = 16 }: P) => svg(size, <path d="m6 9 6 6 6-6" />)

export const PlusIcon = ({ size = 16 }: P) => svg(size, <><path d="M12 5v14" /><path d="M5 12h14" /></>)

export const XIcon = ({ size = 12 }: P) => svg(size, <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>)

export const CalendarIcon = ({ size = 12 }: P) =>
  svg(size, <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>)

export const TruckIcon = ({ size = 12 }: P) =>
  svg(
    size,
    <>
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>,
  )

export const BagIcon = ({ size = 12 }: P) =>
  svg(size, <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>)
