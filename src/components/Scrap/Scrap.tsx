import { useTranslation } from 'react-i18next';
import type { LooseEnd } from '../../projects/projects';
import { cubicPoints } from '../../thread/geometry';
import YarnPath from '../../thread/YarnPath';
import { Tags } from '../Tag/Tag';
import TextLink from '../TextLink/TextLink';
import styles from './Scrap.module.scss';

// the loose end of thread held by the peg (Figma "Loose end", 150 × 40)
const LOOSE_END = [
  ...cubicPoints({ x: 2, y: 26.8 }, { x: 32, y: 6.8 }, { x: 62, y: 56.8 }, { x: 92, y: 36.8 }, 10),
  ...cubicPoints({ x: 92, y: 36.8 }, { x: 112, y: 24.8 }, { x: 122, y: -3.2 }, { x: 152, y: 2.8 }, 10).slice(1),
];

/**
 * Figma "Scrap": a loose-ends item pinned to the line with a peg, its loose
 * thread in the item's theme colour. Slightly rotated on the page.
 */
export default function Scrap({ item, tilt = 0 }: { item: LooseEnd; tilt?: number }) {
  const { t } = useTranslation();
  return (
    <article className={styles.scrap} data-theme={`project-${item.theme}`} style={{ rotate: `${tilt}deg` }}>
      {item.image && <div className={styles.image} aria-hidden="true" />}
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.line}>{item.line}</p>
      <Tags items={item.tags} label={t('looseEnds.tagsLabel')} />
      <TextLink to="/loose-ends" className={styles.link}>
        {item.link} ↗
      </TextLink>
      <YarnPath className={styles.looseEnd} points={LOOSE_END} width={150} height={40} />
      <span className={styles.peg} aria-hidden="true" />
    </article>
  );
}
