"use client";
import {
  Section as BpSection,
  SectionCard,
  SectionProps as BpSectionProps,
} from "@blueprintjs/core";

export type SectionProps = BpSectionProps;

export function Section({ children, ...sectionProps }: SectionProps) {
  return (
    <BpSection {...sectionProps}>
      <SectionCard padded={true}>{children}</SectionCard>
    </BpSection>
  );
}
