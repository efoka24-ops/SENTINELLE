import {
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

interface HovProps {
  as?: ElementType;
  base?: CSSProperties;
  hover?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  href?: string;
  download?: boolean | string;
  type?: string;
  title?: string;
}

/**
 * Élément générique gérant l'état :hover en inline-style
 * (reproduit l'attribut `style-hover` du prototype).
 */
export function Hov({
  as: Tag = 'div',
  base,
  hover,
  children,
  ...rest
}: HovProps) {
  const [h, setH] = useState(false);
  return (
    <Tag
      style={{ ...base, ...(h && hover ? hover : {}) }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
