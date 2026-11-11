import { Award, Printer, ShieldCheck } from 'lucide-react';
import { useLearning } from '@/hooks/useAcademy';
import { CardSkeletons, DataState, PageHeading } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
export function CertificatesPage() {
    const learning = useLearning();
    if (learning.isPending)
        return <CardSkeletons />;
    if (learning.isError)
        return (<DataState error title="Certificates unavailable" description={learning.error.message} retry={() => void learning.refetch()}/>);
    return (<>
      <PageHeading eyebrow="A record of what you’ve learned" title="Your certificates" description="Issued only after every section in a path has a validated assessment completion. No self-reported certificates." action={learning.data.certificates.length ? (<Button variant="outline" onClick={() => window.print()}>
              <Printer size={15} className="mr-2"/>
              Print certificates
            </Button>) : undefined}/>
      {learning.data.certificates.length ? (<div className="grid gap-6 xl:grid-cols-2">
          {learning.data.certificates.map(certificate => (<article key={certificate.id} className="panel relative overflow-hidden border-codekita-purple/30 p-8">
              <Award size={40} className="mb-8 text-codekita-purple"/>
              <p className="eyebrow mb-4">CodeKita Academy</p>
              <h2 className="text-2xl leading-9">{certificate.title}</h2>
              <p className="muted mt-4">Certificate of assessed path completion</p>
              <p className="mt-6 flex items-center gap-2 text-xs text-primary">
                <ShieldCheck size={15}/>
                Issued{' '}
                {new Date(certificate.issuedAt).toLocaleDateString('en', { dateStyle: 'long' })}
              </p>
              <p className="mt-4 break-all border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
                Certificate ID: {certificate.id}
              </p>
            </article>))}
        </div>) : (<DataState title="Your first certificate is waiting to be earned" description="Pass every assessment in a learning path. Your certificate will be issued by the server once the full path is validated."/>)}
    </>);
}
