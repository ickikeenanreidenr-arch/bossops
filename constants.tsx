
import React from 'react';
import { Target, Member, ProductStatus } from './types';

export const OPERATION_LIFECYCLE: { [key: number]: string[] } = {
  1: ["刷非搜10单", "找美工安排打标图", "找美工设计明星图", "设置商品素材"],
  2: ["非搜10单", "报名新品秒杀团"],
  3: ["全标2单", "给外包安排明星图", "设置首单（根据利润设定）"],
  4: ["半标3单", "检查评价是否上评"],
  5: ["明星图置顶", "长尾词5单"],
  6: ["长尾词+核心词（7单）"],
  7: ["核验评价", "核心词10单"],
  8: ["开启全站付费 50元", "观察搜索转化率补单"],
  9: ["观察付费情况", "观察搜索转化率补单"],
  10: ["观察付费，投产高加钱1.5倍", "观察搜索转化率补单"],
  11: ["观察付费情况，调整投产目标"],
  12: ["付费不好调高投产", "开高首单"],
  13: ["观察付费情况"],
  14: ["观察付费情况"],
};

export const TAO_3DAY_STRATEGY: { [key: number]: string[] } = {
  1: ["1、爆款竞价", "2、全标题5单", "3、找小二清退预算加码"],
  2: ["1、半标题8单", "2、找小二清退营销托管", "3、找小二穿衣"],
  3: ["1、精准词10单", "2、报入秒杀新品团", "3、查看有无穿衣成功"],
};

export const TAO_7DAY_STRATEGY: { [key: number]: string[] } = {
  1: ["1、爆款竞价", "2、全标题2单"],
  2: ["1、半标题2单"],
  3: ["1、精准词3单"],
  4: ["1、精准词3单"],
  5: ["1、精准词4单"],
  6: ["1、精准词4单"],
  7: ["1、精准词5单", "2、报入秒杀新品团"],
};

export const getCreditLevel = (score: number) => {
  if (score < 60) return { label: 'DANGER', color: 'text-red-500 bg-red-50 border-red-200' };
  if (score < 100) return { label: 'NORMAL', color: 'text-orange-500 bg-orange-50 border-orange-200' };
  if (score < 150) return { label: 'MAIN', color: 'text-blue-500 bg-blue-50 border-blue-200' };
  if (score < 180) return { label: 'CORE', color: 'text-purple-500 bg-purple-50 border-purple-200' };
  return { label: 'ACE', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
};

export const getCreditColor = (score: number) => getCreditLevel(score).color;

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: '张三', avatar: 'https://picsum.photos/seed/m1/100', role: '金牌运营', contact: '13800138001', creditScore: 120, creditHistory: [] },
  { id: 'm2', name: '李四', avatar: 'https://picsum.photos/seed/m2/100', role: '资深店长', contact: '13800138002', creditScore: 95, creditHistory: [] },
  { id: 'm3', name: '王五', avatar: 'https://picsum.photos/seed/m3/100', role: '新锐运营', contact: '13800138003', creditScore: 55, creditHistory: [] },
  { id: 'm4', name: '赵六', avatar: 'https://picsum.photos/seed/m4/100', role: '视觉设计', contact: '13800138004', creditScore: 160, creditHistory: [] },
];
