import * as React from "react";
import { cn } from "@/lib/utils";

import { Button, type ButtonProps } from "./button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./card";
import { Input, Label } from "./input";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Badge } from "./badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";

// CardDescription is a helper for card descriptions
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Button,
  type ButtonProps,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
  Separator,
  Skeleton,
  Badge,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
};

