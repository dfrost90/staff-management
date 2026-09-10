export type NavItem = {
  title: string;
  url: string;
  children?: NavItem[];
};

export const staffingNav: NavItem[] = [
  { title: "Працівники", url: "/staffing/employees" },
  { title: "Призначення", url: "/staffing/assignments" },
  { title: "Відпустки", url: "/staffing/leave-requests" },
];

export const navigation: NavItem[] = [
  { title: "Підрозділи", url: "/departments" },
  { title: "Посади", url: "/jobs" },
  { title: "Штатна розстановка", url: "/staffing", children: staffingNav },
];
