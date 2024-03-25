import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function repository({ params }) {
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
          <TabsContent value="dashboard">
            <Card className="mb-4 w-full">
              <CardHeader>
                <CardTitle>Dataset</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[125px] w-[250px] rounded-xl" />
              </CardContent>
            </Card>
            <Card className="mb-4 w-full">
              <CardHeader>
                <CardTitle>Models</CardTitle>
                <CardDescription>Card Description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card Content</p>
              </CardContent>
              <CardFooter>
                <p>Card Footer</p>
              </CardFooter>
            </Card>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Picture</Label>
              <Input id="picture" type="file" />
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="roboflowurl" placeholder="Roboflow Url" />
              <Button type="submit">Upload</Button>
            </div>
          </TabsContent>
          <TabsContent value="dataset">dataset</TabsContent>
          <TabsContent value="models">models</TabsContent>
          <TabsContent value="settings">settings</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
