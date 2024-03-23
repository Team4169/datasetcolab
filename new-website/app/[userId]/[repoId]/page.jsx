import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function repoId({ params }) {
  return (
    <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">
          {params.userId} / {params.repoId}
        </h1>
        <Tabs defaultValue="dashboard" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="dataset">Dataset</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">dashboard</TabsContent>
          <TabsContent value="dataset">dataset</TabsContent>
          <TabsContent value="models">models</TabsContent>
          <TabsContent value="settings">settings</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
