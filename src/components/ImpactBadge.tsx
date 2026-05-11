type Props = { impact: 'H' | 'M' | 'L' }

const config = {
  H: { label: 'High Impact', className: 'bg-green-100 text-green-800 border-green-200' },
  M: { label: 'Med Impact', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  L: { label: 'Low Impact', className: 'bg-red-100 text-red-800 border-red-200' },
}

export default function ImpactBadge({ impact }: Props) {
  const { label, className } = config[impact]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
