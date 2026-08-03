import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTChevronLeft from './chatgpt/chevron-left.svg?react';
import ClaudeChevronLeftDesktop from './claude/desktop/chevron-left.svg?react';
import ClaudeChevronLeftMobile from './claude/mobile/chevron-left.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
  direction: 'left' | 'right';
}

/**
 * Renders a chevron icon sourced from the current AI host's own icon set,
 * pointing left or right. Only a left-pointing SVG is vendored per host —
 * the right-pointing variant is the same bilaterally symmetric glyph
 * mirrored via `scaleX(-1)`, rather than vendoring a second asset per host.
 * @param platform - The desktop/mobile bucket derived from the host context.
 * @param direction - Which way the chevron should point.
 */
export function ChevronIcon({ platform, direction, style, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTChevronLeft,
    claudeDesktop: ClaudeChevronLeftDesktop,
    claudeMobile: ClaudeChevronLeftMobile,
  });
  return (
    <Icon
      {...props}
      style={
        direction === 'right' ? { ...style, transform: 'scaleX(-1)' } : style
      }
    />
  );
}

type DirectionalIconProps = { platform: Platform } & SVGProps<SVGSVGElement>;

/** Left-pointing `ChevronIcon`, shaped to match `HostIconButton`'s `icon` prop. */
export function ChevronLeftIcon(props: DirectionalIconProps) {
  return <ChevronIcon {...props} direction="left" />;
}

/** Right-pointing `ChevronIcon`, shaped to match `HostIconButton`'s `icon` prop. */
export function ChevronRightIcon(props: DirectionalIconProps) {
  return <ChevronIcon {...props} direction="right" />;
}
