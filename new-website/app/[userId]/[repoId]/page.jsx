"use client";
import { useState } from "react";
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
import axios from "axios";

export default function Repository({ params }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [roboflowUrl, setRoboflowUrl] = useState("");

  const handleFileChange = (event) => {
    const files = event.target.files;
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleFolderChange = (event) => {
    const folders = event.target.files;
    setSelectedFolders([...selectedFolders, ...folders]);
  };

  const handleUpload = async () => {
    const fileList = [];
    selectedFiles.forEach((file) => {
      fileList.push(file.name);
    });
    selectedFolders.forEach((folder) => {
      fileList.push(folder.name);
    });

    const response = await axios.get(
      `https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/${params.userId}/${params.repoId}/dataset/upload`
    );

    /*
    ,
      {
        headers: {
          files: fileList,
        },
      }
    */
    const responseJson = response.data;
    const { presigned_urls } = responseJson;
    const combinedFiles = [...selectedFiles, ...selectedFolders];
    for (let i = 0; i < presigned_urls.length; i++) {
      const uploadResponse = await axios.put(
        presigned_urls[i],
        combinedFiles[i],
        {
          headers: {
            "Content-Type": combinedFiles[i].type,
          },
        }
      );
      console.log(uploadResponse);
    }

    set(selectedFiles, []);
    set(selectedFolders, []);
  };

  const handleYoutube = async () => {
    try {
      const response = await axios.get(
        `https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/${params.userId}/${params.repoId}/dataset/upload`,
        {
          headers: {
            youtube_url: youtubeUrl,
          }
        }
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRoboflow = async () => {
    const response = await axios.get(
      `https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/${params.userId}/${params.repoId}/dataset/upload`,
      {
        headers: {
          roboflow_url: roboflowUrl,
        },
      }
    );
  }

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
              <Input id="picture" type="file" accept="image/jpeg, image/jpg, image/png, image/webp" />
            </div>
          </TabsContent>
          <TabsContent value="dataset">
            <Button>
              <label htmlFor="file-upload">Upload Files</label>
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg, image/jpg, image/png, image/webp"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </Button>
            <Button>
              <label htmlFor="folder-upload">Upload Folders</label>
              <input
                id="folder-upload"
                type="file"
                multiple
                directory=""
                webkitdirectory=""
                onChange={handleFolderChange}
                style={{ display: "none" }}
              />
            </Button>
            {selectedFiles.length > 0 && (
              <div>
                <h2>Selected Files:</h2>
                <ul>
                  {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedFolders.length > 0 && (
              <div>
                <h2>Selected Folders:</h2>
                <ul>
                  {selectedFolders.map((folder, index) => (
                    <li key={index}>{folder.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={handleUpload}>Upload</Button>

            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="youtubeurl" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Youtube Url" />
              <Button type="submit" onClick={handleYoutube}>Upload</Button>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="roboflowurl" value={roboflowUrl} onChange={(e) => setRoboflowUrl(e.target.value)} placeholder="Roboflow Url" />
              <Button type="submit" onClick={handleRoboflow}>Upload</Button>
            </div>
          </TabsContent>
          <TabsContent value="models">models</TabsContent>
          <TabsContent value="settings">settings</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
