const config = {
  new:               { label: 'New',               cls: 'bg-blue-100 text-blue-700' },
  responded:         { label: 'Responded',          cls: 'bg-green-100 text-green-700' },
  viewing_requested: { label: 'Viewing Requested',  cls: 'bg-purple-100 text-purple-700' },
  closed:            { label: 'Closed',             cls: 'bg-gray-100 text-gray-500' },
}

export default function EnquiryStatusBadge({ status }) {
  const { label, cls } = config[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}
