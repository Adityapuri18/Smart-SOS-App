export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { phoneOrEmail?: string };
  Main: undefined;
  SOSAlert: undefined;
  HelpSent: { notifiedCount?: number } | undefined;
  MapAlert: undefined;
  AddContact: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  History: undefined;
  Settings: undefined;
};

export type DrawerParamList = {
  HomeTabs: undefined;
  Profile: undefined;
  Contacts: undefined;
  History: undefined;
  Settings: undefined;
  AboutApp: undefined;
  HelpSupport: undefined;
};
