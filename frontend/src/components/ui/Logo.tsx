/** "OA" mark. `onDark` is the white square used on the navy header. */
export default function Logo({ onDark = false, large = false }: { onDark?: boolean; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded text-[13px] font-bold ${large ? 'size-[30px]' : 'size-[26px]'} ${
        onDark ? 'bg-white text-navy' : 'bg-navy text-white'
      }`}
    >
      OA
    </span>
  )
}
