function Svg({ children, size = 18, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
)

export const IconPin = (props) => (
  <Svg {...props}>
    <path d="M20 10c0 5.4-8 11-8 11s-8-5.6-8-11a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
)

export const IconClock = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)

export const IconCalendar = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
)

export const IconTicket = (props) => (
  <Svg {...props}>
    <path d="M3 9.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" />
    <path d="M14 5v14" strokeDasharray="2 3" />
  </Svg>
)

export const IconArrow = (props) => (
  <Svg {...props}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
)

export const IconSpark = (props) => (
  <Svg {...props}>
    <path d="m12 3 1.8 4.9L19 9.7l-4.4 3.2L15.7 18 12 15.1 8.3 18l1.1-5.1L5 9.7l5.2-1.8L12 3Z" />
  </Svg>
)

export const IconUsers = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.4 14.4a5.2 5.2 0 0 1 3.1 4.7" />
  </Svg>
)

export const IconCash = (props) => (
  <Svg {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="3" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 9v.01M18 15v.01" />
  </Svg>
)

export const IconPlus = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconEdit = (props) => (
  <Svg {...props}>
    <path d="M4 20h4.3L20 8.3a2.1 2.1 0 0 0 0-3L19 4a2.1 2.1 0 0 0-3 0L4.3 15.7V20Z" />
    <path d="m14.5 5.5 4 4" />
  </Svg>
)

export const IconTrash = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
)

export const IconLogout = (props) => (
  <Svg {...props}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M9 8l-4 4 4 4M5 12h10" />
  </Svg>
)

export const IconDownload = (props) => (
  <Svg {...props}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 19h16" />
  </Svg>
)

export const IconClose = (props) => (
  <Svg {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const IconCheck = (props) => (
  <Svg {...props}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
)

export const IconShield = (props) => (
  <Svg {...props}>
    <path d="M12 3.5 5 6.3v5.2c0 4.5 3 7.7 7 9.2 4-1.5 7-4.7 7-9.2V6.3L12 3.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Svg>
)

export const IconAlert = (props) => (
  <Svg {...props}>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 9.5v4.5M12 17v.01" />
  </Svg>
)

export const IconCompass = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2.1 5-5 2.1 2.1-5 5-2.1Z" />
  </Svg>
)

export const IconGlobe = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
  </Svg>
)

export const IconChevron = (props) => (
  <Svg {...props}>
    <path d="m8 10 4 4 4-4" />
  </Svg>
)
