import { createFileRoute, notFound } from '@tanstack/react-router';
import { AdminPanel, AdminError } from '@/components/site/AdminPanel';
import { adminSections, type AdminSection } from '@/lib/admin-rules';
import { pageMeta } from '@/lib/route-meta';
export const Route = createFileRoute('/_authenticated/admin/$section')({
  validateSearch:(s:Record<string,unknown>)=>({q:typeof s['q']==='string'?s['q']:'',status:typeof s['status']==='string'?s['status']:'all',cat:typeof s['cat']==='string'?s['cat']:'all',when:typeof s['when']==='string'?s['when']:'all',rank:typeof s['rank']==='string'?s['rank']:'all',state:typeof s['state']==='string'?s['state']:'all',city:typeof s['city']==='string'?s['city']:'all'}),
  beforeLoad:({params})=>{if(!adminSections.some(s=>s===params.section))throw notFound();},
  head:({params})=>pageMeta(`Admin ${params.section}`,'Manage Chartसीखो records with protected administrator access.'),
  notFoundComponent:AdminError,
  component:Screen,
});
function Screen(){const {section}=Route.useParams();const search=Route.useSearch();return <AdminPanel section={section as AdminSection} query={search.q} status={search.status} cat={search.cat} when={search.when} rank={search.rank} ustate={search.state} city={search.city}/>;}
