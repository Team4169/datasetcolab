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
//import {Features} from "@/components/framerMotion/feautures";
import TopBanner from "@/components/homepage/topBanner";

const Homepage: React.FC = () => {

  return (
    <>
    
    <TopBanner />
    </>
  );
};

export default Homepage;
