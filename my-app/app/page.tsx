"use client";
import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const Homepage: React.FC = () => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [visibility, setVisibility] = React.useState("public");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const createDataset = async () => {
    try {
      const response = await fetch(`https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/new/seanmabli/${name}`, {
        method: 'POST',
        headers: {
          'Description': description,
          'Tags': tags,
          'Visibility': visibility,
        },
      });

      if (response.ok) {
        console.log('Data submitted successfully');
      } else {
        console.error('Failed to submit data');
      }
    } catch (error) {
      console.error('An error occurred while submitting data:', error);
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <header className="text-center py-10">
          <h1 className="text-4xl font-bold text-blue-900">
            Welcome to Dataset Colab
          </h1>
          <p className="text-blue-600">
            The ultimate platform for discovering, sharing, and collaborating on
            datasets across various domains.
          </p>
        </header>
        <section className="py-10">
          <h2 className="text-3xl font-bold text-blue-900">
            Why Dataset Colab?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Discover & Access
              </h5>
              <p className="font-normal text-gray-700">
                Gain access to a vast repository of datasets, curated for
                quality and relevance.
              </p>
            </div>
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Contribute & Collaborate
              </h5>
              <p className="font-normal text-gray-700">
                Share your datasets and collaborate with the community to
                enhance research and innovation.
              </p>
            </div>
            <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-900">
                Tools & Analytics
              </h5>
              <p className="font-normal text-gray-700">
                Leverage advanced tools for dataset analysis and visualization
                to drive insights.
              </p>
            </div>
          </div>
        </section>
        <div className="flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mr-4">
            Explore Repositories (Datasets + Models)
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Join the Community
          </button>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">New Dataset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Dataset</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description">Dataset Name</Label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Badge variant="outline">username</Badge>
                  <span className="text-lg">{"     "}/</span>
                </Label>
                <Input
                  id="name"
                  className="col-span-3 ml-0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description">Description</Label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Textarea
                  id="description"
                  className="col-span-4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags">Tags</Label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Input
                  id="tags"
                  className="col-span-4"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="visibility">Visibility</Label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <RadioGroup
                  defaultValue="public"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility((e.target as HTMLInputElement).value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />{" "}
                    {/* disable */}
                    <Label htmlFor="private">Private</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={createDataset}>Create Dataset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Homepage;
