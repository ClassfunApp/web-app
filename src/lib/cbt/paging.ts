export type Page<T> = { data: T[]; total: number };
/**
 * Drain a paged CBT list. Banks and exams feed selectors that must show every
 * row, and the server caps a page at 100. A page that comes back empty ends the
 * walk so a server whose total disagrees with its rows cannot spin forever.
 */
export async function drainPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<Page<T>>,
  limit = 100,
): Promise<Page<T>> {
  const data: T[] = [];
  let total = 0;
  for (;;) {
    const page = await fetchPage(data.length, limit);
    total = Number(page?.total ?? 0);
    if (!page?.data?.length) break;
    data.push(...page.data);
    if (data.length >= total) break;
  }
  return { data, total };
}
