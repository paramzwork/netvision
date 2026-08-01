import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  value: string;
  children: React.ReactNode;
}
export function TooltipComponent({ value, children }: Props) {
  return (
    <Tooltip >
      <TooltipTrigger >{children}</TooltipTrigger>
      <TooltipContent>
        <p>{value}</p>
      </TooltipContent>
    </Tooltip>
  );
}
