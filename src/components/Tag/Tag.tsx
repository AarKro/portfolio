import styles from './Tag.module.scss';

/** Figma "Tag": a tool or discipline in an outlined pill. Render inside a list. */
export default function Tag({ label }: { label: string }) {
  return <li className={styles.tag}>{label}</li>;
}

/** A row of tags; `label` names the list for screen readers. */
export function Tags({ items, label, className }: { items: string[]; label: string; className?: string }) {
  return (
    <ul className={className ? `${styles.tags} ${className}` : styles.tags} aria-label={label}>
      {items.map((item) => (
        <Tag key={item} label={item} />
      ))}
    </ul>
  );
}
