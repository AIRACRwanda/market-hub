const colours = {
  pending_review:       'bg-yellow-100 text-yellow-800',
  proof_requested:      'bg-orange-100 text-orange-800',
  under_review:         'bg-blue-100 text-blue-800',
  published:            'bg-green-100 text-green-800',
  rejected:             'bg-red-100 text-red-800',
  permanently_rejected: 'bg-red-200 text-red-900',
  expired:              'bg-gray-200 text-gray-700',
  sold:                 'bg-purple-100 text-purple-800',
  rented:               'bg-indigo-100 text-indigo-800',
  removed:              'bg-gray-100 text-gray-500',
  hidden:               'bg-gray-100 text-gray-600',
}

const labels = {
  pending_review:       'Pending Review',
  proof_requested:      'Proof Requested',
  under_review:         'Under Review',
  published:            'Published',
  rejected:             'Rejected',
  permanently_rejected: 'Perm. Rejected',
  expired:              'Expired',
  sold:                 'Sold',
  rented:               'Rented',
  removed:              'Removed',
  hidden:               'Hidden',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}
