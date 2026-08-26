import Link from 'next/link';

export function Brand({ linked = true }: { linked?: boolean }) {
  const content = <><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>RecruitMerge</span></>;
  return linked ? <Link className="brand" href="/">{content}</Link> : <div className="brand">{content}</div>;
}
