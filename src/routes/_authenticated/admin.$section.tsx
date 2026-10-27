import { createFileRoute, notFound } from '@tanstack/react-router';
import { AdminPanel, AdminError } from '@/components/site/AdminPanel';
import { adminSections, type AdminSection } from '@/lib/admin-rules';
import { pageMeta } from '@/lib/route-meta';
export const Route = createFileRoute('/_authenticated/admin/$section')({
  validateSearch:(s:Record<string,unknown>)=>({q:typeof s.q==='string'?s.q:'',status:typeof s.status==='string'?s.status:'all'}),
  beforeLoad:({params})=>{if(!adminSections.some(s=>s===params.section))throw notFound();},
  head:({params})=>pageMeta(`Admin ${params.section}`,'Manage Chartसीखो records with protected administrator access.'),
  notFoundComponent:AdminError,
  component:Screen,
});
function Screen(){const {section}=Route.useParams();const search=Route.useSearch();return <AdminPanel section={section as AdminSection} query={search.q} status={search.status}/>;}