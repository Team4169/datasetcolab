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

export default function User({ params }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createDataset = async () => {
    try {
      const response = await fetch(
        `https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/seanmabli/${name}/init`,
        {
          method: "POST",
          headers: {
            description: description,
            tags: tags,
            visibility: visibility,
          },
        }
      );

      if (response.ok) {
        console.log("Data submitted successfully");
      } else {
        console.error("Failed to submit data");
      }
    } catch (error) {
      console.error("An error occurred while submitting data:", error);
    }
  };

  const repoExists = async (name) => {
    try {
      const response = await fetch(
        `https://fqk4k22rqc.execute-api.us-east-1.amazonaws.com/seanmabli/${name}/exists`,
        {
          method: "GET",
        }
      );

      return response.ok;
    } catch (error) {
      console.error("An error occurred while checking if repo exists:", error);
      return false;
    }
  };

  console.log(repoExists(name));

  return (
    <div>
      <h1>User Profile {params.userId}</h1>

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
              {repoExists(name) === true && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input
                    id="name"
                    className="col-span-3 ml-0 bg-green-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              {repoExists(name) === false && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input
                    id="name"
                    className="col-span-3 ml-0 bg-red-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              {repoExists(name) === null && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input
                    id="name"
                    className="col-span-3 ml-0 bg-gray-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
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
                onChange={(e) => setVisibility(e.target.value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={createDataset}>
              Create Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
