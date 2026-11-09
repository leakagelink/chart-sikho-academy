import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogQuery } from '@/lib/catalog-query';
import { CloudCourseDetail } from '@/components/site/CloudCourseDetail';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { pageMeta } from '@/lib/route-meta';
import { ProductSocial } from '@/components/site/ProductSocial';
export const Route=createFileRoute('/courses_/$courseId')({
 loader:async({context,params})=>{const items=await context.queryClient.ensureQueryData(catalogQuery());const course=items.find(c=>c.id===params.courseId);if(!course)throw notFound();return course;},
 head:({loaderData})=>pageMeta(loaderData?.title??'Course','Explore this published Chartसीखो course and its learning content.'),
 notFoundComponent:Unavailable,component:Screen,
});
function Screen(){const {courseId}=Route.useParams();const {data}=useSuspenseQuery(catalogQuery());const course=data.find(c=>c.id===courseId);return course?<><CloudCourseDetail course={course}/><div className="px-4 pb-6"><ProductSocial kind="course" id={course.id} title={course.title}/></div></>:<Unavailable/>;}
function Unavailable(){const {t}=useLang();return <section className="px-4 py-12"><p>{t('no_results')}</p><Button asChild className="mt-4"><Link to="/courses">{t('all_courses')}</Link></Button></section>;}
