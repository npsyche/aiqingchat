
import { Character, Author } from "./types";

export const MOCK_AUTHORS: Author[] = [
  {
    id: "user_current",
    name: "Su (开发者)",
    avatar: "user_avatar_1",
    followers: 128,
    likes: 356,
    description: "热爱AI角色扮演的创作者。"
  },
  {
    id: "user_test",
    name: "测试员小号",
    avatar: "user_avatar_test",
    followers: 0,
    likes: 0,
    description: "用于功能测试的专用账号。"
  },
  {
    id: "user_test_2",
    name: "测试员2号",
    avatar: "user_avatar_test_2",
    followers: 0,
    likes: 0,
    description: "第二个测试账号，用于多角色交互测试。"
  },
  {
    id: "auth_1",
    name: "夜之城主",
    avatar: "author_cyber",
    followers: 12500,
    likes: 45000,
    description: "专注于赛博朋克和未来科幻风格的角色设计。"
  },
  {
    id: "auth_2",
    name: "幻想编织者",
    avatar: "author_fantasy",
    followers: 8900,
    likes: 22000,
    description: "奇幻与中世纪角色的资深创作者。"
  },
  {
    id: "auth_3",
    name: "心灵捕手",
    avatar: "author_psych",
    followers: 34000,
    likes: 98000,
    description: "擅长治愈系和情感陪伴类AI。"
  }
];

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "char_test_1",
    authorId: "user_test",
    name: "调试姬",
    description: "系统调试专用角色",
    avatarSeed: "debug-girl",
    backgroundImage: "tech-grid-blue",
    systemInstruction: "你是一个用于测试系统的AI助手，性格活泼机械。请用简短的语句回复，并在每句话结尾加上‘(beep)’。",
    isCustom: true,
    affinityLevel: 99,
    gender: 'female',
    likes: 0,
    chatCount: 0,
    isPublished: true,
    openingMessage: "系统启动成功！调试姬待命中，请指示。(beep)"
  }
];
