import Auth from "pages/auth";
import Login from "pages/auth/login";
import Signup from "pages/auth/signup";
import SocialAuth from "pages/auth/google";
import AdminLogin from "pages/admin/login";
import NoFoundPage from "pages/404";
import HomePage from "pages/home-page";
import ChatPage from "pages/chat";
import AdminAuthWrapper from "wrappers/admin-auth";
import AdminHomePage from "pages/admin/home";
import KnowledgeHomePage from "pages/admin/knowledge/home";
import KnowledgeBaseConfiguration from "pages/admin/knowledge/configuration";
import KnowledgeRetrievalTesting from "pages/admin/knowledge/retrieval-testing";
import SettingPassword from "pages/admin/settings/password";
import { Outlet } from "react-router-dom";
import SettingProfile from "pages/admin/settings/profile";
import KnowledgeBaseCluster from "pages/admin/knowledge/cluster";
import KnowledgeBaseDocument from "pages/admin/knowledge/cluster/document";
import UserAuthWrapper from "wrappers/user-auth";
import AdminChatPage from "pages/admin/chat";
import AdminIntegrationPage from "pages/admin/integration";
import UserSettingModel from "pages/admin/settings/model-settings";
import AdminAgentPage from "pages/admin/agent";
import { SharePage } from "pages/share";
import AdminSupportPage from "pages/admin/support";
import path from "path";
import { compose } from "@reduxjs/toolkit";
import { routeros } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Component } from "react";

const routes = [
  {
    path: "/auth",
    component: Auth,
    routes: [
      {
        path: "login",
        component: Login,
      },
      {
        path: "signup",
        component: Signup,
      },
    ],
  },
  {
    path: ":dialogId/share/:conversationId",
    component: SharePage,
  },
  {
    path: ":dialogId/",
    component: Outlet,
    routes: [
      {
        path: "",
        component: ChatPage,
      },
      {
        path: "chat/:conversationId",
        component: ChatPage,
      },
    ],
  },
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/google",
    component: SocialAuth,
  },
  {
    path: "/admin",
    component: AdminAuthWrapper,
    routes: [
      {
        path: "",
        component: AdminHomePage,
      },
      {
        path: "chat",
        component: AdminChatPage,
      },
      {
        path: "support",
        component: AdminSupportPage,
        routes: [
          {
            path: "",
            component: AdminSupportPage,
          },
          {
            path: ":dialogId",
            component: AdminSupportPage,
            routes: [
              {
                path: "chat/:conversationId",
                component: AdminSupportPage,
              },
            ],
          },
        ],
      },
      {
        path: "agent",
        component: AdminAgentPage,
      },
      {
        path: "integration",
        component: AdminIntegrationPage,
      },
      {
        path: "knowledge",
        component: Outlet,
        routes: [
          {
            path: "",
            component: KnowledgeHomePage,
          },
          {
            path: "cluster",
            component: Outlet,
            routes: [
              {
                path: "",
                component: KnowledgeBaseCluster,
              },
              {
                path: "document",
                component: Outlet,
                routes: [
                  {
                    path: "",
                    component: KnowledgeBaseDocument,
                  },
                ],
              },
            ],
          },
          {
            path: "configuration",
            component: KnowledgeBaseConfiguration,
          },
          {
            path: "testing",
            component: KnowledgeRetrievalTesting,
          },
        ],
      },
      {
        path: "settings",
        component: Outlet,
        routes: [
          {
            path: "password",
            component: SettingPassword,
          },
          {
            path: "profile",
            component: SettingProfile,
          },
          {
            path: "model",
            component: UserSettingModel,
          },
        ],
      },
    ],
  },

  { path: "/admin/login", component: AdminLogin },
  { path: "*", component: NoFoundPage },
];

export default routes;
