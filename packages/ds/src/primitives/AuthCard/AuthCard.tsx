import type { ElementType, ReactNode } from "react";

import { Card } from "../Card/Card";
import { Stack } from "../Layout/Layout";
import { Heading } from "../Typography/Typography";

export interface AuthCardProps {
  /** The screen's heading. Rendered as the page's `h1`. */
  title: ReactNode;
  children: ReactNode;
  /**
   * Element to render.
   *
   * @remarks
   * `main` by default, because a sign-in screen usually *is* the page. Pass `as="div"` when it is
   * not: a document with two `main` landmarks has told a screen reader nothing about which is the
   * content.
   */
  as?: ElementType;
  className?: string;
}

/**
 * A centred card for a sign-in, sign-up or recovery screen.
 *
 * @remarks
 * Pure composition over {@link Card}, {@link Stack} and {@link Heading}, which is exactly why it
 * belongs here: a consuming project used it six times across two applications and then reproduced
 * the same four nested elements inline a seventh time, because the component lived in one app's
 * folder and the other could not import it. That is a distribution problem rather than a design
 * one, and shipping it here is the fix.
 *
 * @example
 * ```tsx
 * <AuthCard title="Sign in">
 *   <Stack as="form" gap={3} onSubmit={submit}>
 *     <FormField id="email" label="Email">{(c) => <Input {...c} type="email" />}</FormField>
 *     <Button type="submit" loading={busy}>Sign in</Button>
 *   </Stack>
 * </AuthCard>
 * ```
 *
 * @public
 */
export function AuthCard({ title, children, as: Tag = "main", className }: AuthCardProps) {
  return (
    <Tag className={["yl-auth", className].filter(Boolean).join(" ")}>
      <Card className="yl-auth__card" padding={6}>
        <Stack gap={4}>
          <Heading level={1} size="md">
            {title}
          </Heading>
          {children}
        </Stack>
      </Card>
    </Tag>
  );
}
