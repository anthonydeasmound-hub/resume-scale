import TabsNav from "@/components/TabsNav";
import { MasterResumeSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-warm">
      <TabsNav />
      <main className="md:ml-64 p-8 pt-20 md:pt-8">
        <MasterResumeSkeleton />
      </main>
    </div>
  );
}
