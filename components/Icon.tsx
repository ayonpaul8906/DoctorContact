import React from 'react';
import type { ColorValue } from 'react-native';
import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

export type IconName =
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'shield'
  | 'shield-check'
  | 'stethoscope'
  | 'clock'
  | 'arrow-right'
  | 'arrow-left'
  | 'alert-circle'
  | 'phone'
  | 'message-circle'
  | 'sparkles'
  | 'log-out'
  | 'check-circle'
  | 'user'
  | 'home'
  | 'building'
  | 'pulse'
  | 'calendar'
  | 'layout-dashboard'
  | 'map-pin'
  | 'users'
  | 'chevron-right'
  | 'chevron-left'
  | 'award'
  | 'activity'
  | 'heart'
  | 'save'
  | 'refresh-cw'
  | 'star'
  | 'dollar-sign'
  | 'search'
  | 'filter'
  | 'x'
  | 'check'
  | 'list-ordered'
  | 'skip-forward'
  | 'skip-back'
  | 'pause'
  | 'play'
  | 'lock-closed'
  | 'lock-open'
  | 'alert-triangle'
  | 'sliders'
  | 'inbox'
  | 'trending-up'
  | 'file-text'
  | 'calendar-days'
  | 'calendar-clock'
  | 'plus'
  | 'bell'
  | 'trash-2'
  | 'flask'
  | 'chevron-down'
  | 'headphones'
  | 'megaphone'
  | 'settings'
  | 'radio'
  | 'camera'
  | 'user-check'
  | 'user-x'
  | 'x-circle'
  | 'trending-down'
  | 'pie-chart'
  | 'file-spreadsheet'
  | 'image'
  | 'mic'
  | 'mic-off'
  | 'globe'
  | 'circle'
  | 'calendar-plus'
  | 'calendar-x'
  | 'user-plus'
  | 'info'
  | 'rotate-ccw'
  | 'arrow-up-right';

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

type RawIconProps = { name: string; size?: number; color?: ColorValue };

const FeatherIcon = Feather as unknown as React.ComponentType<RawIconProps>;
const MaterialCommunityIcon = MaterialCommunityIcons as unknown as React.ComponentType<RawIconProps>;
const Ionicon = Ionicons as unknown as React.ComponentType<RawIconProps>;

export function Icon({ name, size = 20, color = '#111827' }: IconProps) {
  switch (name) {
    case 'mail':
      return <FeatherIcon name="mail" size={size} color={color} />;
    case 'lock':
      return <FeatherIcon name="lock" size={size} color={color} />;
    case 'eye':
      return <FeatherIcon name="eye" size={size} color={color} />;
    case 'eye-off':
      return <FeatherIcon name="eye-off" size={size} color={color} />;
    case 'shield':
      return <FeatherIcon name="shield" size={size} color={color} />;
    case 'shield-check':
      return <MaterialCommunityIcon name="shield-check-outline" size={size} color={color} />;
    case 'stethoscope':
      return <MaterialCommunityIcon name="stethoscope" size={size} color={color} />;
    case 'clock':
      return <FeatherIcon name="clock" size={size} color={color} />;
    case 'arrow-right':
      return <FeatherIcon name="arrow-right" size={size} color={color} />;
    case 'arrow-left':
      return <FeatherIcon name="arrow-left" size={size} color={color} />;
    case 'alert-circle':
      return <FeatherIcon name="alert-circle" size={size} color={color} />;
    case 'phone':
      return <FeatherIcon name="phone" size={size} color={color} />;
    case 'message-circle':
      return <Ionicon name="chatbubble-ellipses-outline" size={size} color={color} />;
    case 'sparkles':
      return <Ionicon name="sparkles-outline" size={size} color={color} />;
    case 'log-out':
      return <FeatherIcon name="log-out" size={size} color={color} />;
    case 'check-circle':
      return <FeatherIcon name="check-circle" size={size} color={color} />;
    case 'user':
      return <FeatherIcon name="user" size={size} color={color} />;
    case 'home':
      return <FeatherIcon name="home" size={size} color={color} />;
    case 'building':
      return <MaterialCommunityIcon name="hospital-building" size={size} color={color} />;
    case 'pulse':
      return <MaterialCommunityIcon name="heart-pulse" size={size} color={color} />;
    case 'calendar':
      return <FeatherIcon name="calendar" size={size} color={color} />;
    case 'layout-dashboard':
      return <MaterialCommunityIcon name="view-dashboard-outline" size={size} color={color} />;
    case 'map-pin':
      return <FeatherIcon name="map-pin" size={size} color={color} />;
    case 'users':
      return <FeatherIcon name="users" size={size} color={color} />;
    case 'chevron-right':
      return <FeatherIcon name="chevron-right" size={size} color={color} />;
    case 'chevron-left':
      return <FeatherIcon name="chevron-left" size={size} color={color} />;
    case 'award':
      return <FeatherIcon name="award" size={size} color={color} />;
    case 'activity':
      return <FeatherIcon name="activity" size={size} color={color} />;
    case 'heart':
      return <FeatherIcon name="heart" size={size} color={color} />;
    case 'save':
      return <FeatherIcon name="save" size={size} color={color} />;
    case 'refresh-cw':
      return <FeatherIcon name="refresh-cw" size={size} color={color} />;
    case 'star':
      return <FeatherIcon name="star" size={size} color={color} />;
    case 'dollar-sign':
      return <FeatherIcon name="dollar-sign" size={size} color={color} />;
    case 'search':
      return <FeatherIcon name="search" size={size} color={color} />;
    case 'filter':
      return <FeatherIcon name="filter" size={size} color={color} />;
    case 'x':
      return <FeatherIcon name="x" size={size} color={color} />;
    case 'check':
      return <FeatherIcon name="check" size={size} color={color} />;
    case 'list-ordered':
      return <FeatherIcon name="list" size={size} color={color} />;
    case 'skip-forward':
      return <FeatherIcon name="skip-forward" size={size} color={color} />;
    case 'skip-back':
      return <FeatherIcon name="skip-back" size={size} color={color} />;
    case 'pause':
      return <FeatherIcon name="pause" size={size} color={color} />;
    case 'play':
      return <FeatherIcon name="play" size={size} color={color} />;
    case 'lock-closed':
      return <FeatherIcon name="lock" size={size} color={color} />;
    case 'lock-open':
      return <FeatherIcon name="unlock" size={size} color={color} />;
    case 'alert-triangle':
      return <FeatherIcon name="alert-triangle" size={size} color={color} />;
    case 'sliders':
      return <FeatherIcon name="sliders" size={size} color={color} />;
    case 'inbox':
      return <FeatherIcon name="inbox" size={size} color={color} />;
    case 'trending-up':
      return <FeatherIcon name="trending-up" size={size} color={color} />;
    case 'file-text':
      return <FeatherIcon name="file-text" size={size} color={color} />;
    case 'calendar-days':
      return <FeatherIcon name="calendar" size={size} color={color} />;
    case 'calendar-clock':
      return <MaterialCommunityIcon name="calendar-clock" size={size} color={color} />;
    case 'plus':
      return <FeatherIcon name="plus" size={size} color={color} />;
    case 'bell':
      return <FeatherIcon name="bell" size={size} color={color} />;
    case 'trash-2':
      return <FeatherIcon name="trash-2" size={size} color={color} />;
    case 'flask':
      return <MaterialCommunityIcon name="flask-outline" size={size} color={color} />;
    case 'chevron-down':
      return <FeatherIcon name="chevron-down" size={size} color={color} />;
    case 'headphones':
      return <FeatherIcon name="headphones" size={size} color={color} />;
    case 'megaphone':
      return <Ionicons name="megaphone-outline" size={size} color={color} />;
    case 'settings':
      return <FeatherIcon name="settings" size={size} color={color} />;
    case 'radio':
      return <FeatherIcon name="radio" size={size} color={color} />;
    case 'camera':
      return <FeatherIcon name="camera" size={size} color={color} />;
    case 'user-check':
      return <FeatherIcon name="user-check" size={size} color={color} />;
    case 'user-x':
      return <FeatherIcon name="user-x" size={size} color={color} />;
    case 'x-circle':
      return <FeatherIcon name="x-circle" size={size} color={color} />;
    case 'trending-down':
      return <FeatherIcon name="trending-down" size={size} color={color} />;
    case 'pie-chart':
      return <FeatherIcon name="pie-chart" size={size} color={color} />;
    case 'file-spreadsheet':
      return <MaterialCommunityIcon name="file-excel-outline" size={size} color={color} />;
    case 'image':
      return <FeatherIcon name="image" size={size} color={color} />;
    case 'mic':
      return <FeatherIcon name="mic" size={size} color={color} />;
    case 'mic-off':
      return <FeatherIcon name="mic-off" size={size} color={color} />;
    case 'globe':
      return <FeatherIcon name="globe" size={size} color={color} />;
    case 'circle':
      return <FeatherIcon name="circle" size={size} color={color} />;
    case 'calendar-plus':
      return <FeatherIcon name="calendar" size={size} color={color} />;
    case 'calendar-x':
      return <FeatherIcon name="calendar" size={size} color={color} />;
    case 'user-plus':
      return <FeatherIcon name="user-plus" size={size} color={color} />;
    case 'info':
      return <FeatherIcon name="info" size={size} color={color} />;
    case 'rotate-ccw':
      return <FeatherIcon name="rotate-ccw" size={size} color={color} />;
    case 'arrow-up-right':
      return <FeatherIcon name="arrow-up-right" size={size} color={color} />;
    default:
      return <FeatherIcon name="help-circle" size={size} color={color} />;
  }
}
