import Layout from '../Layout';
import { RecoilRoot } from 'recoil';

export default function LayoutExample() {
  return (
    <RecoilRoot>
      <Layout>
        <div className="p-8">
          <h1 className="text-3xl font-bold">Page Content</h1>
          <p className="text-muted-foreground mt-2">This is where the page content goes.</p>
        </div>
      </Layout>
    </RecoilRoot>
  );
}
