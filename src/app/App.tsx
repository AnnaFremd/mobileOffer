import { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronLeft,
  MoreVertical,
  Search,
  ChevronDown,
  RotateCcw,
  TriangleAlert,
  X,
  Star,
  Edit2,
  User,
  UserRound,
  Truck,
  CreditCard
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import imgProduct1 from "figma:asset/b751bc8ec11d7ee1bae67231c8cfbb7ef65be767.png";
import imgProduct2 from "figma:asset/4c395a8979005777aa0ddac106915804cd8901c0.png";
import imgProduct3 from "figma:asset/230f7921f731e9153a0c68c5b187f0c7fff1e9f5.png";
import imgAvatar from "figma:asset/5dd6fca175575696012861fc13ca31dd8d720ad5.png";

type ProductGroup = {
  id: string;
  name: string;
  description: string;
  products: Product[];
};

type Product = {
  id: string;
  sku: string;
  name: string;
  comment?: string;
  clientCommentEnabled?: boolean;
  shortDescription?: string;
  fullDescription?: string;
  link?: string;
  piggyEnabled?: boolean;
  quantity: number;
  price: number;
  discount?: number;
  image?: string;
  source: 'catalog' | 'local';
  hasUpdates?: boolean;
  isPrimary?: boolean;
  alternatives?: Alternative[];
  addons?: Addon[];
};

type Alternative = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  source?: 'catalog' | 'local';
  comment?: string;
  discount?: number;
  hasUpdates?: boolean;
  isPrimary?: boolean;
};

type Addon = {
  id: string;
  sku?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  source?: 'catalog' | 'local';
  comment?: string;
  discount?: number;
  hasUpdates?: boolean;
};

type ProductDragItem = {
  productId: string;
  groupId: string;
  index: number;
  sourceKind: 'product' | 'alternative';
  alternativeGroupId?: string;
  alternativeIndex?: number;
};

type ProductDropPosition = 'before' | 'after' | 'addon' | 'blocked' | null;

type ProductLocation = {
  groupIndex: number;
  productIndex: number;
  sourceKind: 'product' | 'alternative';
  alternativeIndex?: number;
  alternativeGroupId?: string;
};

type RelatedItemKind = 'alternative' | 'addon';

type RelatedItemEditor = {
  kind: RelatedItemKind;
  itemId: string;
};

type RelatedItemDraft = {
  sku: string;
  name: string;
  quantity: string;
  price: string;
  discount: string;
  comment: string;
  isPrimary: boolean;
};

type ProductSubscreen = 'comment' | 'content' | 'alternatives' | 'addons' | null;

type ProductContentDraft = {
  shortDescription: string;
  fullDescription: string;
  link: string;
};

type PiggyAdjustment = {
  writeOff: string;
  markup: string;
};

type OfferStatusTone = 'success' | 'warning' | 'neutral' | 'danger';

type OfferStatusOption = {
  id: string;
  label: string;
  tone: OfferStatusTone;
};

const TOP_HEADER_HEIGHT = 52;
const OFFER_CHIPS_HEIGHT = 52;
const COLLAPSIBLE_HEADER_HEIGHT = TOP_HEADER_HEIGHT + OFFER_CHIPS_HEIGHT;
const GROUP_HEADER_HEIGHT = 56;
const HEADER_SCROLL_THRESHOLD = 12;

const emptyRelatedItemDraft: RelatedItemDraft = {
  sku: '',
  name: '',
  quantity: '1',
  price: '0',
  discount: '',
  comment: '',
  isPrimary: false
};

const emptyProductContentDraft: ProductContentDraft = {
  shortDescription: '',
  fullDescription: '',
  link: ''
};

const offerStatusOptions: OfferStatusOption[] = [
  { id: 'draft', label: 'Черновик', tone: 'neutral' },
  { id: 'in-work', label: 'В работе', tone: 'warning' },
  { id: 'approval', label: 'На согласовании', tone: 'warning' },
  { id: 'closed-success', label: 'Закрыто успешно', tone: 'success' },
  { id: 'cancelled', label: 'Отменено', tone: 'danger' }
];

const offerStatusToneClasses: Record<OfferStatusTone, { pill: string; dot: string; itemDot: string }> = {
  success: {
    pill: 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#DCEEDC]',
    dot: 'bg-[#2E7D32]',
    itemDot: 'bg-[#2E7D32]'
  },
  warning: {
    pill: 'bg-[#FFF7E6] text-[#B7791F] hover:bg-[#FFECC7]',
    dot: 'bg-[#F59E0B]',
    itemDot: 'bg-[#F59E0B]'
  },
  neutral: {
    pill: 'bg-[rgba(13,45,94,0.06)] text-[rgba(13,45,94,0.72)] hover:bg-[rgba(13,45,94,0.1)]',
    dot: 'bg-[rgba(13,45,94,0.4)]',
    itemDot: 'bg-[rgba(13,45,94,0.4)]'
  },
  danger: {
    pill: 'bg-[#FFF1F0] text-[#EC3F39] hover:bg-[#FFE5E2]',
    dot: 'bg-[#EC3F39]',
    itemDot: 'bg-[#EC3F39]'
  }
};

const svgPaths = {
  p311a4f00: "M6.32501 3.17005C6.66251 3.56255 6.60376 4.15005 6.30626 4.5738C5.86192 5.20447 5.62392 5.95732 5.62501 6.7288C5.62501 7.5313 5.87751 8.27505 6.30626 8.8838C6.60376 9.30755 6.66126 9.89505 6.32501 10.2875C5.98751 10.6813 5.38751 10.73 5.05626 10.3325C4.21066 9.32225 3.74815 8.04627 3.75001 6.7288C3.75001 5.35755 4.24126 4.1013 5.05626 3.12505C5.38876 2.72755 5.98751 2.7763 6.32501 3.17005ZM12.425 3.17005C12.0875 3.56255 12.1463 4.15005 12.4438 4.5738C12.8738 5.18255 13.125 5.9263 13.125 6.7288C13.125 7.5313 12.8738 8.27505 12.4438 8.8838C12.1463 9.30755 12.0888 9.89505 12.425 10.2875C12.7625 10.6813 13.3625 10.73 13.6938 10.3325C14.5394 9.32225 15.0019 8.04627 15 6.7288C15.0019 5.41133 14.5394 4.13535 13.6938 3.12505C13.3625 2.72755 12.7625 2.7763 12.425 3.17005ZM14.8663 0.322549C14.5288 0.716299 14.5788 1.3038 14.9288 1.68755C16.1837 3.06633 16.8779 4.86443 16.875 6.7288C16.875 8.67005 16.1375 10.4388 14.9275 11.77C14.58 12.1538 14.5288 12.7413 14.865 13.135C15.2025 13.5275 15.7988 13.5763 16.1563 13.2013C17.8237 11.4594 18.7531 9.14018 18.75 6.7288C18.75 4.2188 17.7625 1.9388 16.1563 0.256299C15.7988 -0.118701 15.2025 -0.0699513 14.8663 0.322549ZM3.88376 0.322549C3.54626 -0.0699513 2.95126 -0.118701 2.59376 0.256299C0.926378 1.99828 -0.00298578 4.31744 7.20673e-06 6.7288C7.20673e-06 9.2388 0.987507 11.5188 2.59376 13.2013C2.95126 13.5763 3.54751 13.5275 3.88376 13.135C4.22126 12.7413 4.17126 12.1538 3.82126 11.77C2.56633 10.3913 1.87215 8.59317 1.87501 6.7288C1.87501 4.78755 2.61251 3.0188 3.82251 1.68755C4.17001 1.3038 4.22001 0.716299 3.88376 0.322549ZM10.3125 8.3538C10.67 8.14742 10.9493 7.82887 11.1073 7.44753C11.2652 7.0662 11.2929 6.6434 11.1861 6.24472C11.0793 5.84603 10.8439 5.49373 10.5164 5.24246C10.189 4.9912 9.78776 4.855 9.37501 4.855C8.96226 4.855 8.56104 4.9912 8.23358 5.24246C7.90612 5.49373 7.67072 5.84603 7.5639 6.24472C7.45707 6.6434 7.48478 7.0662 7.64273 7.44753C7.80069 7.82887 8.08005 8.14742 8.43751 8.3538V15.48C8.43751 15.7287 8.53628 15.9671 8.71209 16.143C8.88791 16.3188 9.12637 16.4175 9.37501 16.4175C9.62365 16.4175 9.8621 16.3188 10.0379 16.143C10.2137 15.9671 10.3125 15.7287 10.3125 15.48V8.3538Z",
  p3396da00: "M8.8614 2.89395C9.27249 1.23209 10.7736 2.44379e-05 12.5625 2.44379e-05C14.6681 2.44379e-05 16.375 1.70694 16.375 3.81252C16.375 4.39219 16.2456 4.94164 16.0142 5.43358C16.1558 5.48606 16.2867 5.57355 16.3931 5.69516C17.0483 6.44403 17.526 7.31894 17.7831 8.27753C17.7953 8.26809 17.8066 8.25844 17.8172 8.24865C17.8888 8.18256 17.9769 8.06461 18.067 7.83935C18.2593 7.35862 18.8049 7.12479 19.2857 7.31708C19.7664 7.50938 20.0002 8.05497 19.8079 8.53571C19.648 8.93545 19.4237 9.3175 19.089 9.62641C18.7775 9.91395 18.4091 10.1024 17.9967 10.2039C17.9416 12.388 17.1972 14.4458 15.2605 15.5651L14.7286 18.0117C14.6349 18.4426 14.2535 18.75 13.8125 18.75H5.68751C5.27489 18.75 4.91077 18.4802 4.79063 18.0855L4.05938 15.6828C3.69431 15.5242 3.37018 15.2916 3.10431 15.0391C2.70193 14.6568 2.36264 14.163 2.18062 13.6312L2.1742 13.6228C2.15722 13.6015 2.12958 13.5737 2.09376 13.5469C2.06293 13.5238 2.03564 13.5085 2.01702 13.5H0.937512C0.419745 13.5 1.2219e-05 13.0803 1.2219e-05 12.5625V7.8125C1.2219e-05 7.29474 0.419745 6.875 0.937512 6.875H2.06251C2.06508 6.87513 2.09189 6.87641 2.15626 6.82813C2.21504 6.78405 2.28245 6.71457 2.35279 6.62014C2.53918 6.13844 2.73853 5.73146 3.06266 5.36411C3.2884 5.10828 3.5534 4.89695 3.85441 4.69122L3.75076 2.09998C3.75026 2.08749 3.75001 2.075 3.75001 2.06251C3.75001 1.68167 3.878 1.23144 4.24927 0.913202C4.64458 0.574367 5.14883 0.527239 5.58592 0.665624C6.38039 0.894205 7.85635 1.43934 8.8614 2.89395ZM10.625 3.81252C10.625 2.74247 11.4925 1.87502 12.5625 1.87502C13.6326 1.87502 14.5 2.74247 14.5 3.81252C14.5 4.87892 13.6385 5.74409 12.5735 5.74999H12.5515C11.4865 5.74409 10.625 4.87892 10.625 3.81252ZM9.48637 6.06518C9.28131 5.78564 9.11345 5.47712 8.99005 5.14691C8.96441 5.16 8.93795 5.17205 8.91069 5.18295C8.42996 5.37525 7.88436 5.14142 7.69206 4.66068C7.23958 3.52947 6.38138 2.96869 5.64999 2.66825L5.74926 5.15004C5.76272 5.48637 5.59483 5.8041 5.30939 5.9825C4.80635 6.2969 4.60254 6.45286 4.46861 6.60465C4.34907 6.74012 4.24095 6.92334 4.06532 7.39168C4.04014 7.45883 4.00734 7.52287 3.96756 7.58254C3.67981 8.01416 3.0602 8.75 2.06251 8.75H1.87501V11.625H2.06251C2.52698 11.625 2.94046 11.8382 3.21876 12.0469C3.502 12.2593 3.80998 12.5903 3.9519 13.016C4.0218 13.2257 4.17868 13.4735 4.39571 13.6797C4.61688 13.8898 4.82863 13.9898 4.96664 14.0128C5.31792 14.0713 5.6057 14.3238 5.70939 14.6645L6.38214 16.875H8.75001V15.8126C8.75001 15.2948 9.16975 14.8751 9.68751 14.8751C10.2053 14.8751 10.625 15.2948 10.625 15.8126V16.875H13.0569L13.5214 14.7384C13.5836 14.4523 13.7758 14.2117 14.0411 14.088C15.4505 13.4302 16.125 12.0013 16.125 9.93751C16.125 8.92563 15.8001 7.99654 15.213 7.21454C15.0443 7.4623 14.7599 7.62499 14.4375 7.62499H12.5779C12.5728 7.62501 12.5676 7.62502 12.5625 7.62502C12.5574 7.62502 12.5523 7.62501 12.5471 7.62499H10.1875C9.66978 7.62499 9.25004 7.20526 9.25004 6.68749C9.25004 6.44868 9.33934 6.23072 9.48637 6.06518Z",
  p3bc5ae80: "M6.125 12.25C7.74945 12.25 9.30737 11.6047 10.456 10.456C11.6047 9.30737 12.25 7.74945 12.25 6.125C12.25 4.50055 11.6047 2.94263 10.456 1.79397C9.30737 0.645311 7.74945 0 6.125 0C4.50055 0 2.94263 0.645311 1.79397 1.79397C0.645311 2.94263 0 4.50055 0 6.125C0 7.74945 0.645311 9.30737 1.79397 10.456C2.94263 11.6047 4.50055 12.25 6.125 12.25ZM8.8375 4.76875C8.88921 4.69981 8.92683 4.62135 8.94822 4.53787C8.96961 4.45439 8.97434 4.36751 8.96215 4.28219C8.94997 4.19688 8.92109 4.1148 8.87719 4.04064C8.83328 3.96649 8.77519 3.90171 8.70625 3.85C8.63731 3.79829 8.55885 3.76067 8.47537 3.73928C8.39188 3.71789 8.30501 3.71316 8.21969 3.72535C8.13438 3.73753 8.0523 3.76641 7.97814 3.81031C7.90399 3.85422 7.83921 3.91231 7.7875 3.98125L5.61663 6.87575L4.40125 5.66125C4.27685 5.54533 4.11231 5.48222 3.94229 5.48522C3.77228 5.48822 3.61007 5.55709 3.48983 5.67733C3.36959 5.79757 3.30072 5.95978 3.29772 6.12979C3.29472 6.29981 3.35783 6.46435 3.47375 6.58875L5.22375 8.33875C5.29021 8.4052 5.37017 8.4566 5.45822 8.48947C5.54626 8.52234 5.64034 8.53592 5.73409 8.52928C5.82784 8.52264 5.91907 8.49595 6.00161 8.451C6.08414 8.40605 6.15606 8.3439 6.2125 8.26875L8.8375 4.76875Z",
  p3ccb1a80: "M6.125 10.9375C7.40135 10.9375 8.62543 10.4305 9.52795 9.52795C10.4305 8.62543 10.9375 7.40135 10.9375 6.125C10.9375 4.84865 10.4305 3.62457 9.52795 2.72205C8.62543 1.81953 7.40135 1.3125 6.125 1.3125C4.84865 1.3125 3.62457 1.81953 2.72205 2.72205C1.81953 3.62457 1.3125 4.84865 1.3125 6.125C1.3125 7.40135 1.81953 8.62543 2.72205 9.52795C3.62457 10.4305 4.84865 10.9375 6.125 10.9375ZM6.125 12.25C7.74945 12.25 9.30737 11.6047 10.456 10.456C11.6047 9.30737 12.25 7.74945 12.25 6.125C12.25 4.50055 11.6047 2.94263 10.456 1.79397C9.30737 0.645311 7.74945 0 6.125 0C4.50055 0 2.94263 0.645311 1.79397 1.79397C0.645311 2.94263 0 4.50055 0 6.125C0 7.74945 0.645311 9.30737 1.79397 10.456C2.94263 11.6047 4.50055 12.25 6.125 12.25ZM7 8.3125C7 8.54456 6.90781 8.76712 6.74372 8.93122C6.57962 9.09531 6.35706 9.1875 6.125 9.1875C5.89294 9.1875 5.67038 9.09531 5.50628 8.93122C5.34219 8.76712 5.25 8.54456 5.25 8.3125C5.25 8.08044 5.34219 7.85788 5.50628 7.69378C5.67038 7.52969 5.89294 7.4375 6.125 7.4375C6.35706 7.4375 6.57962 7.52969 6.74372 7.69378C6.90781 7.85788 7 8.08044 7 8.3125ZM6.78125 3.5C6.78125 3.32595 6.71211 3.15903 6.58904 3.03596C6.46597 2.91289 6.29905 2.84375 6.125 2.84375C5.95095 2.84375 5.78403 2.91289 5.66096 3.03596C5.53789 3.15903 5.46875 3.32595 5.46875 3.5V5.6875C5.46875 5.86155 5.53789 6.02847 5.66096 6.15154C5.78403 6.27461 5.95095 6.34375 6.125 6.34375C6.29905 6.34375 6.46597 6.27461 6.58904 6.15154C6.71211 6.02847 6.78125 5.86155 6.78125 5.6875V3.5Z",
  p49e3f80: "M5.81248 9.06255C6.36477 9.06255 6.81248 8.61484 6.81248 8.06256C6.81248 7.51027 6.36477 7.06255 5.81248 7.06255C5.2602 7.06255 4.81248 7.51027 4.81248 8.06256C4.81248 8.61484 5.2602 9.06255 5.81248 9.06255Z",
  p1107c200: "M10.4994 5.99941C10.4994 6.59036 10.383 7.17552 10.1569 7.72148C9.93072 8.26745 9.59925 8.76353 9.18139 9.18139C8.76353 9.59925 8.26745 9.93072 7.72148 10.1569C7.17552 10.383 6.59036 10.4994 5.99941 10.4994C5.40846 10.4994 4.8233 10.383 4.27733 10.1569C3.73137 9.93072 3.23529 9.59925 2.81743 9.18139C2.39956 8.76353 2.0681 8.26745 1.84195 7.72148C1.6158 7.17552 1.49941 6.59036 1.49941 5.99941C1.49941 4.80593 1.97351 3.66134 2.81743 2.81743C3.66134 1.97351 4.80593 1.49941 5.99941 1.49941C7.19288 1.49941 8.33748 1.97351 9.18139 2.81743C10.0253 3.66134 10.4994 4.80593 10.4994 5.99941ZM9.67941 10.7394C8.47379 11.6754 6.95678 12.1167 5.43721 11.9735C3.91764 11.8304 2.50975 11.1135 1.50016 9.96881C0.490564 8.82412 -0.0448401 7.33771 0.00294397 5.81216C0.0507281 4.28661 0.678108 2.83662 1.75736 1.75736C2.83662 0.678108 4.28661 0.0507281 5.81216 0.00294397C7.33771 -0.0448401 8.82412 0.490564 9.96881 1.50016C11.1135 2.50975 11.8304 3.91764 11.9735 5.43721C12.1167 6.95678 11.6754 8.47379 10.7394 9.67941L13.5294 12.4694C13.6031 12.5381 13.6622 12.6209 13.7032 12.7129C13.7442 12.8049 13.7662 12.9042 13.768 13.0049C13.7698 13.1056 13.7513 13.2056 13.7135 13.299C13.6758 13.3924 13.6197 13.4772 13.5484 13.5484C13.4772 13.6197 13.3924 13.6758 13.299 13.7135C13.2056 13.7513 13.1056 13.7698 13.0049 13.768C12.9042 13.7662 12.8049 13.7442 12.7129 13.7032C12.6209 13.6622 12.5381 13.6031 12.4694 13.5294L9.67941 10.7394Z",
  p37d81b00: "M6.25 0C6.44891 0 6.63968 0.0790177 6.78033 0.21967C6.92098 0.360322 7 0.551088 7 0.75V5.5H11.75C11.9489 5.5 12.1397 5.57902 12.2803 5.71967C12.421 5.86032 12.5 6.05109 12.5 6.25C12.5 6.44891 12.421 6.63968 12.2803 6.78033C12.1397 6.92098 11.9489 7 11.75 7H7V11.75C7 11.9489 6.92098 12.1397 6.78033 12.2803C6.63968 12.421 6.44891 12.5 6.25 12.5C6.05109 12.5 5.86032 12.421 5.71967 12.2803C5.57902 12.1397 5.5 11.9489 5.5 11.75V7H0.75C0.551088 7 0.360322 6.92098 0.21967 6.78033C0.0790177 6.63968 0 6.44891 0 6.25C0 6.05109 0.0790177 5.86032 0.21967 5.71967C0.360322 5.57902 0.551088 5.5 0.75 5.5H5.5V0.75C5.5 0.551088 5.57902 0.360322 5.71967 0.21967C5.86032 0.0790177 6.05109 0 6.25 0Z",
  p180e1000: "M7 12.5C8.45869 12.5 9.85764 11.9205 10.8891 10.8891C11.9205 9.85764 12.5 8.45869 12.5 7C12.5 5.54131 11.9205 4.14236 10.8891 3.11091C9.85764 2.07946 8.45869 1.5 7 1.5C5.54131 1.5 4.14236 2.07946 3.11091 3.11091C2.07946 4.14236 1.5 5.54131 1.5 7C1.5 8.45869 2.07946 9.85764 3.11091 10.8891C4.14236 11.9205 5.54131 12.5 7 12.5ZM7 14C8.85651 14 10.637 13.2625 11.9497 11.9497C13.2625 10.637 14 8.85651 14 7C14 5.14348 13.2625 3.36301 11.9497 2.05025C10.637 0.737498 8.85651 0 7 0C5.14348 0 3.36301 0.737498 2.05025 2.05025C0.737498 3.36301 0 5.14348 0 7C0 8.85651 0.737498 10.637 2.05025 11.9497C3.36301 13.2625 5.14348 14 7 14ZM8 9.5C8 9.76522 7.89464 10.0196 7.70711 10.2071C7.51957 10.3946 7.26522 10.5 7 10.5C6.73478 10.5 6.48043 10.3946 6.29289 10.2071C6.10536 10.0196 6 9.76522 6 9.5C6 9.23478 6.10536 8.98043 6.29289 8.79289C6.48043 8.60536 6.73478 8.5 7 8.5C7.26522 8.5 7.51957 8.60536 7.70711 8.79289C7.89464 8.98043 8 9.23478 8 9.5ZM7.75 4C7.75 3.80109 7.67098 3.61032 7.53033 3.46967C7.38968 3.32902 7.19891 3.25 7 3.25C6.80109 3.25 6.61032 3.32902 6.46967 3.46967C6.32902 3.61032 6.25 3.80109 6.25 4V6.5C6.25 6.69891 6.32902 6.88968 6.46967 7.03033C6.61032 7.17098 6.80109 7.25 7 7.25C7.19891 7.25 7.38968 7.17098 7.53033 7.03033C7.67098 6.88968 7.75 6.69891 7.75 6.5V4Z"
};

interface DraggableGroupProps {
  group: ProductGroup;
  index: number;
  isSelected: boolean;
  moveGroup: (fromIndex: number, toIndex: number) => void;
  onSelectGroup: (groupId: string) => void;
}

function DraggableGroup({ group, index, isSelected, moveGroup, onSelectGroup }: DraggableGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'group',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'group',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveGroup(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      onClick={() => onSelectGroup(group.id)}
      className={`flex items-center gap-3 px-4 py-3 border-b border-[rgba(13,45,94,0.08)] cursor-pointer transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${
        isOver
          ? 'bg-[rgba(0,127,255,0.08)] border-[#007FFF]'
          : isSelected
            ? 'bg-[#EEF6FF]'
            : 'hover:bg-[rgba(13,45,94,0.04)]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-medium text-[#222934] truncate">{group.name}</div>
        <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{group.products.length} позиций</div>
      </div>
    </div>
  );
}

interface DraggableProductProps {
  product: Product;
  groupId: string;
  index: number;
  sourceKind?: 'product' | 'alternative';
  alternativeGroupId?: string;
  alternativeIndex?: number;
  onMakeAddon: (draggedProductId: string, targetProductId: string) => void;
  onReorder: (draggedProductId: string, targetProductId: string, targetGroupId: string, position: 'before' | 'after') => void;
  onClick: () => void;
  setDragTooltip: (text: string) => void;
  children: React.ReactNode;
}

function DraggableProduct({
  product,
  groupId,
  index,
  sourceKind = 'product',
  alternativeGroupId,
  alternativeIndex,
  onMakeAddon,
  onReorder,
  onClick,
  setDragTooltip,
  children
}: DraggableProductProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<ProductDropPosition>(null);

  const dragItem: ProductDragItem = {
    productId: product.id,
    groupId,
    index,
    sourceKind,
    alternativeGroupId,
    alternativeIndex
  };

  const [{ isDragging }, drag] = useDrag({
    type: 'product',
    item: dragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'product',
    hover: (item: ProductDragItem, monitor) => {
      if (item.productId === product.id || !ref.current) {
        setDropPosition(null);
        setDragTooltip('');
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        setDropPosition(null);
        setDragTooltip('');
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.height;

      const topThird = hoverHeight / 3;
      const bottomThird = (hoverHeight * 2) / 3;

      if (hoverClientY > topThird && hoverClientY < bottomThird) {
        setDropPosition('addon');
        setDragTooltip('Добавить доп к товару');
      } else if (hoverClientY < topThird) {
        setDropPosition('before');
        setDragTooltip('Сортировать товары');
      } else {
        setDropPosition('after');
        setDragTooltip('Сортировать товары');
      }
    },
    drop: (item: ProductDragItem, monitor) => {
      if (item.productId === product.id || !ref.current) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.height;

      const topThird = hoverHeight / 3;
      const bottomThird = (hoverHeight * 2) / 3;

      if (hoverClientY > topThird && hoverClientY < bottomThird) {
        onMakeAddon(item.productId, product.id);
      } else {
        const position = hoverClientY < topThird ? 'before' : 'after';
        onReorder(item.productId, product.id, groupId, position);
      }

      setDropPosition(null);
      setDragTooltip('');
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (!isOver) {
      setDropPosition(null);
      setDragTooltip('');
    }
  }, [isOver]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`relative cursor-grab transition-all active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Drop indicator - blue line for before */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#007FFF] z-10 -mt-0.5" />
      )}

      {/* Drop indicator - blue line for after */}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007FFF] z-10 -mb-0.5" />
      )}

      {/* Drop indicator - highlight for adding as addon */}
      {dropPosition === 'addon' && (
        <div className="absolute inset-0 bg-[rgba(0,127,255,0.08)] border-2 border-[#007FFF] rounded-lg z-10 pointer-events-none" />
      )}

      {dropPosition === 'blocked' && (
        <div className="absolute inset-0 bg-[rgba(236,63,57,0.08)] border-2 border-[#EC3F39] rounded-lg z-10 pointer-events-none" />
      )}

      {children}
    </div>
  );
}

interface DroppableGroupHeaderProps {
  groupId: string;
  onProductDrop: (productId: string, fromGroupId: string, toGroupId: string) => void;
  setDragTooltip: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

function DroppableGroupHeader({
  groupId,
  onProductDrop,
  setDragTooltip,
  className = '',
  style,
  children
}: DroppableGroupHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'product',
    hover: (item: ProductDragItem) => {
      if (item.groupId !== groupId || item.sourceKind === 'alternative') {
        setDragTooltip(item.sourceKind === 'alternative' ? 'Вынести из альтернатив' : 'Переместить в группу');
      }
    },
    drop: (item: ProductDragItem) => {
      if (item.groupId !== groupId || item.sourceKind === 'alternative') {
        onProductDrop(item.productId, item.groupId, groupId);
      }
      setDragTooltip('');
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (!isOver) {
      setDragTooltip('');
    }
  }, [isOver]);

  drop(ref);

  return (
    <div
      ref={ref}
      className={`border-b border-[rgba(13,45,94,0.08)] ${className} ${
        isOver ? 'bg-[rgba(0,127,255,0.08)]' : 'bg-white'
      }`}
      style={style}
    >
      {children}
    </div>
  );
}

interface DraggableGroupContentProps {
  index: number;
  moveGroup: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
}

function DraggableGroupContent({ index, moveGroup, children }: DraggableGroupContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'group-content',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'group-content',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveGroup(item.index, index);
        item.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}


export default function App() {
  const [searchQuery] = useState('');
  const [currentGroupId, setCurrentGroupId] = useState<string>('');
  const [isPiggyExpanded, setIsPiggyExpanded] = useState(false);
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = useState(false);
  const [isOfferMenuOpen, setIsOfferMenuOpen] = useState(false);
  const [isOfferIssuesOpen, setIsOfferIssuesOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [offerStatusId, setOfferStatusId] = useState('closed-success');
  const [isOfferDescriptionDrawerOpen, setIsOfferDescriptionDrawerOpen] = useState(false);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [isDeliveryDrawerOpen, setIsDeliveryDrawerOpen] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('Коммерческое предложение для автосервиса');
  const [offerDescription, setOfferDescription] = useState(
    'Подобрали оборудование для запуска и расширения шиномонтажной мастерской. В предложении собраны основные позиции, альтернативы и дополнительные товары, чтобы клиент мог быстро согласовать итоговый состав.'
  );
  const [editingOfferTitle, setEditingOfferTitle] = useState('');
  const [editingOfferDescription, setEditingOfferDescription] = useState('');
  const [groupContextMenuId, setGroupContextMenuId] = useState<string | null>(null);
  const [isGroupEditDrawerOpen, setIsGroupEditDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; groupId: string } | null>(null);
  const [isAddAlternativeMode, setIsAddAlternativeMode] = useState(false);
  const [isAddAddonMode, setIsAddAddonMode] = useState(false);
  const [relatedItemEditor, setRelatedItemEditor] = useState<RelatedItemEditor | null>(null);
  const [relatedItemDraft, setRelatedItemDraft] = useState<RelatedItemDraft>(emptyRelatedItemDraft);
  const [productSubscreen, setProductSubscreen] = useState<ProductSubscreen>(null);
  const [productContentDraft, setProductContentDraft] = useState<ProductContentDraft>(emptyProductContentDraft);
  const [isProductActionsOpen, setIsProductActionsOpen] = useState(false);
  const [alternativeSource, setAlternativeSource] = useState<'offer' | 'catalog' | 'new'>('offer');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [pinnedGroupId, setPinnedGroupId] = useState<string | null>(null);
  const [isMoveToGroupMode, setIsMoveToGroupMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupComment, setEditingGroupComment] = useState('');
  const [dragTooltip, setDragTooltip] = useState<string>('');
  const [piggyAdjustments, setPiggyAdjustments] = useState<Record<string, PiggyAdjustment>>({});

  const groupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const headerVisibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const groupsRef = useRef<ProductGroup[]>([]);

  const [groups, setGroups] = useState<ProductGroup[]>([
    {
      id: 'group-1',
      name: 'Шиномонтажное оборудование',
      description: 'Набор оборудования для профессионального шиномонтажа. Все необходимое для мастерской: от станков до инструментов.',
      products: [
        {
          id: 'p-1',
          sku: 'WT-LUG-21-CHROME',
          name: 'Динамометрический ключ - Профессиональный инструмент для точной затяжки крепежа, диапазон 40-200 Нм, сертификат калибровки',
          comment: 'Отличное приобретение!',
          clientCommentEnabled: true,
          shortDescription: 'Инструмент для точной затяжки колесного крепежа в профессиональной мастерской.',
          fullDescription: 'Профессиональный динамометрический ключ с диапазоном 40-200 Нм подходит для шиномонтажных постов и сервисных зон. Помогает выдерживать момент затяжки, снижает риск повреждения крепежа и упрощает контроль качества работ. Поставляется с сертификатом калибровки.',
          link: 'https://example.com/products/wt-lug-21-chrome',
          piggyEnabled: false,
          quantity: 5,
          price: 8700,
          discount: 12.5,
          image: imgProduct1,
          source: 'catalog',
          hasUpdates: true,
          isPrimary: true,
          alternatives: [
            {
              id: 'alt-1',
              sku: 'TSHIRT-RED-XL-COTTON',
              name: 'Подъемник двухстоечный - Электрогидравлический, грузоподъемность 4 тонны, автома...',
              quantity: 2,
              price: 55000,
              image: imgProduct2,
              isPrimary: false
            }
          ],
          addons: []
        }
      ]
    },
    {
      id: 'group-2',
      name: 'Дополнительное оборудование',
      description: 'Вспомогательное оборудование для расширения возможностей мастерской.',
      products: [
        {
          id: 'p-2',
          sku: 'COMP-AIR-100',
          name: 'Компрессор воздушный промышленный',
          quantity: 1,
          price: 45000,
          image: imgProduct2,
          source: 'catalog',
          alternatives: [],
          addons: []
        }
      ]
    },
    {
      id: 'group-3',
      name: 'Новая группа 3',
      description: '',
      products: [
        {
          id: 'p-3',
          sku: '1.1',
          name: 'Компрессор',
          quantity: 3,
          price: 12500,
          image: imgProduct3,
          source: 'local',
          alternatives: [],
          addons: []
        }
      ]
    }
  ]);

  const getGroupProductCount = (group: ProductGroup) => {
    return group.products.length;
  };

  const moveGroup = (fromIndex: number, toIndex: number) => {
    const updatedGroups = [...groups];
    const [movedGroup] = updatedGroups.splice(fromIndex, 1);
    updatedGroups.splice(toIndex, 0, movedGroup);
    setGroups(updatedGroups);
  };

  const scrollToGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    const element = groupRefs.current[groupId];
    if (element && contentRef.current) {
      const container = contentRef.current;
      const elementTop = element.offsetTop;
      const offset = headerVisibleRef.current ? COLLAPSIBLE_HEADER_HEIGHT : 0;
      container.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
    setIsGroupDrawerOpen(false);
  };

  const setHeaderVisibility = (visible: boolean) => {
    if (headerVisibleRef.current === visible) {
      return;
    }

    headerVisibleRef.current = visible;
    setHeaderVisible(visible);
  };

  // Update groupsRef when groups changes
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!contentRef.current) {
            ticking = false;
            return;
          }

          const scrollTop = contentRef.current.scrollTop;
          const currentScrollY = scrollTop;

          if (currentScrollY <= HEADER_SCROLL_THRESHOLD) {
            setHeaderVisibility(true);
            lastScrollY.current = currentScrollY;
          } else {
            const scrollDelta = currentScrollY - lastScrollY.current;

            if (Math.abs(scrollDelta) >= HEADER_SCROLL_THRESHOLD) {
              if (scrollDelta > 0) {
                setHeaderVisibility(false);
              } else {
                setHeaderVisibility(true);
              }

              lastScrollY.current = currentScrollY;
            }
          }

          const currentGroups = groupsRef.current;
          const containerRect = contentRef.current?.getBoundingClientRect();
          const stickyTop = headerVisibleRef.current ? COLLAPSIBLE_HEADER_HEIGHT : 0;
          const activationLine = containerRect ? containerRect.top + stickyTop : 0;
          const trackingLine = containerRect
            ? activationLine + GROUP_HEADER_HEIGHT + 8
            : 0;
          let visibleGroupId = currentGroups[0]?.id;
          let nextPinnedGroupId: string | null = null;

          for (let i = currentGroups.length - 1; i >= 0; i--) {
            const group = currentGroups[i];
            const element = groupRefs.current[group.id];
            if (element && element.getBoundingClientRect().top <= trackingLine) {
              visibleGroupId = group.id;
              break;
            }
          }

          for (let i = currentGroups.length - 1; i >= 0; i--) {
            const group = currentGroups[i];
            const element = groupRefs.current[group.id];
            if (!element) {
              continue;
            }

            const groupRect = element.getBoundingClientRect();
            const isGroupAtStickyLine = groupRect.top <= activationLine + 1;
            const hasGroupBelowHeader = groupRect.bottom > activationLine + GROUP_HEADER_HEIGHT + 4;

            if (isGroupAtStickyLine && hasGroupBelowHeader) {
              nextPinnedGroupId = group.id;
              break;
            }
          }

          if (visibleGroupId) {
            setCurrentGroupId(visibleGroupId);
          }
          setPinnedGroupId(nextPinnedGroupId);

          ticking = false;
        });

        ticking = true;
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      if (content) {
        content.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const groupContextMenu = groups.find(g => g.id === groupContextMenuId);
  const editingGroup = groups.find(g => g.id === editingGroupId);

  const totalAmount = groups.reduce((sum, g) =>
    sum + g.products.reduce((pSum, p) => {
      const itemTotal = p.price * p.quantity;
      const discount = p.discount ? (itemTotal * p.discount / 100) : 0;
      const addonsTotal = p.addons?.reduce((addonSum, addon) => {
        const addonTotal = addon.price * addon.quantity;
        const addonDiscount = addon.discount ? (addonTotal * addon.discount / 100) : 0;
        return addonSum + (addonTotal - addonDiscount);
      }, 0) ?? 0;
      return pSum + (itemTotal - discount) + addonsTotal;
    }, 0), 0
  );
  const formattedTotalAmount = totalAmount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleGroups = normalizedSearchQuery
    ? groups
        .map(group => ({
          ...group,
          products: group.products.filter(product =>
            [
              group.name,
              group.description,
              product.sku,
              product.name,
              product.comment,
              ...(product.alternatives?.flatMap(alt => [alt.sku, alt.name]) ?? []),
              ...(product.addons?.map(addon => addon.name) ?? [])
            ]
              .filter(Boolean)
              .some(value => value!.toLowerCase().includes(normalizedSearchQuery))
          )
        }))
        .filter(group => group.products.length > 0)
    : groups;

  const calculateGroupTotal = (group: ProductGroup) => {
    return group.products.reduce((sum, p) => {
      const itemTotal = p.price * p.quantity;
      const discount = p.discount ? (itemTotal * p.discount / 100) : 0;
      const addonsTotal = p.addons?.reduce((addonSum, addon) => {
        const addonTotal = addon.price * addon.quantity;
        const addonDiscount = addon.discount ? (addonTotal * addon.discount / 100) : 0;
        return addonSum + (addonTotal - addonDiscount);
      }, 0) ?? 0;
      return sum + (itemTotal - discount) + addonsTotal;
    }, 0);
  };

  const calculateGroupDiscount = (group: ProductGroup) => {
    const totalWithoutDiscount = group.products.reduce((sum, p) => {
      const productTotal = p.price * p.quantity;
      const addonsTotal = p.addons?.reduce((addonSum, addon) => addonSum + (addon.price * addon.quantity), 0) ?? 0;
      return sum + productTotal + addonsTotal;
    }, 0);
    const totalWithDiscount = calculateGroupTotal(group);
    if (totalWithoutDiscount === 0) return 0;
    return ((totalWithoutDiscount - totalWithDiscount) / totalWithoutDiscount) * 100;
  };

  const addNewProduct = (groupId: string) => {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      sku: 'NEW-ITEM',
      name: 'Новый товар',
      quantity: 1,
      price: 0,
      source: 'local',
      alternatives: [],
      addons: []
    };

    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, products: [...g.products, newProduct] }
        : g
    ));
  };

  const addNewGroup = () => {
    const newGroup: ProductGroup = {
      id: `group-${Date.now()}`,
      name: 'Новая группа',
      description: '',
      products: []
    };

    setGroups([...groups, newGroup]);
  };

  const cloneGroups = (sourceGroups: ProductGroup[]): ProductGroup[] =>
    sourceGroups.map(group => ({
      ...group,
      products: group.products.map(product => ({
        ...product,
        alternatives: product.alternatives?.map(alternative => ({ ...alternative })),
        addons: product.addons?.map(addon => ({ ...addon }))
      }))
    }));

  const productToAlternative = (product: Product): Alternative => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    quantity: product.quantity,
    price: product.price,
    image: product.image,
    source: product.source,
    comment: product.comment,
    discount: product.discount,
    hasUpdates: product.hasUpdates,
    isPrimary: false
  });

  const productToAddon = (product: Product): Addon => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    quantity: product.quantity,
    price: product.price,
    image: product.image,
    source: product.source,
    comment: product.comment,
    discount: product.discount,
    hasUpdates: product.hasUpdates
  });

  const alternativeToProduct = (alternative: Alternative): Product => ({
    id: alternative.id,
    sku: alternative.sku,
    name: alternative.name,
    quantity: alternative.quantity,
    price: alternative.price,
    image: alternative.image,
    source: alternative.source ?? 'catalog',
    comment: alternative.comment,
    discount: alternative.discount,
    hasUpdates: alternative.hasUpdates,
    isPrimary: alternative.isPrimary,
    alternatives: [],
    addons: []
  });

  const addonToProduct = (addon: Addon): Product => ({
    id: addon.id,
    sku: addon.sku || 'ADDON',
    name: addon.name,
    quantity: addon.quantity,
    price: addon.price,
    image: addon.image,
    source: addon.source ?? 'local',
    comment: addon.comment,
    discount: addon.discount,
    hasUpdates: addon.hasUpdates,
    alternatives: [],
    addons: []
  });

  const normalizeAlternativeProduct = (product: Product) => {
    if (!product.alternatives?.length) {
      product.alternatives = [];
      product.isPrimary = undefined;
      return;
    }

    const hasPrimary = product.isPrimary || product.alternatives.some(alternative => alternative.isPrimary);
    if (!hasPrimary) {
      product.isPrimary = true;
    }
  };

  const findProductLocation = (sourceGroups: ProductGroup[], productId: string): ProductLocation | null => {
    for (let groupIndex = 0; groupIndex < sourceGroups.length; groupIndex++) {
      const group = sourceGroups[groupIndex];
      const productIndex = group.products.findIndex(product => product.id === productId);

      if (productIndex !== -1) {
        return {
          groupIndex,
          productIndex,
          sourceKind: 'product',
          alternativeGroupId: group.products[productIndex].alternatives?.length
            ? group.products[productIndex].id
            : undefined
        };
      }

      for (let parentIndex = 0; parentIndex < group.products.length; parentIndex++) {
        const parentProduct = group.products[parentIndex];
        const alternativeIndex = parentProduct.alternatives?.findIndex(alternative => alternative.id === productId) ?? -1;

        if (alternativeIndex !== -1) {
          return {
            groupIndex,
            productIndex: parentIndex,
            sourceKind: 'alternative',
            alternativeIndex,
            alternativeGroupId: parentProduct.id
          };
        }
      }
    }

    return null;
  };

  const removeProductFromGroups = (sourceGroups: ProductGroup[], productId: string): Product | null => {
    const location = findProductLocation(sourceGroups, productId);
    if (!location) return null;

    const group = sourceGroups[location.groupIndex];
    const product = group.products[location.productIndex];

    if (location.sourceKind === 'product') {
      const [removedProduct] = group.products.splice(location.productIndex, 1);

      return {
        ...removedProduct,
        alternatives: removedProduct.alternatives?.map(alternative => ({ ...alternative })) ?? [],
        addons: removedProduct.addons?.map(addon => ({ ...addon })) ?? []
      };
    }

    if (location.alternativeIndex === undefined || !product.alternatives) return null;

    const [removedAlternative] = product.alternatives.splice(location.alternativeIndex, 1);

    if (removedAlternative.isPrimary) {
      product.isPrimary = true;
    }

    normalizeAlternativeProduct(product);
    return alternativeToProduct(removedAlternative);
  };

  const addProductToAlternativeGroup = (draggedProductId: string, targetProductId: string) => {
    if (draggedProductId === targetProductId) return;

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const targetLocation = findProductLocation(newGroups, targetProductId);
      if (!targetLocation) return prevGroups;

      const targetAlternativeGroupId = targetLocation.sourceKind === 'alternative'
        ? targetLocation.alternativeGroupId
        : targetProductId;

      if (!targetAlternativeGroupId) return prevGroups;

      const draggedLocation = findProductLocation(newGroups, draggedProductId);
      if (!draggedLocation || draggedLocation.alternativeGroupId === targetAlternativeGroupId) {
        return prevGroups;
      }

      const draggedProduct = removeProductFromGroups(newGroups, draggedProductId);
      if (!draggedProduct) return prevGroups;

      const refreshedTargetLocation = findProductLocation(newGroups, targetAlternativeGroupId);
      if (!refreshedTargetLocation || refreshedTargetLocation.sourceKind !== 'product') return prevGroups;

      const targetProduct = newGroups[refreshedTargetLocation.groupIndex].products[refreshedTargetLocation.productIndex];
      targetProduct.alternatives = targetProduct.alternatives || [];
      targetProduct.isPrimary = targetProduct.isPrimary ?? true;
      targetProduct.alternatives.push(productToAlternative(draggedProduct));
      normalizeAlternativeProduct(targetProduct);

      return newGroups;
    });
  };

  const addProductAsAddon = (draggedProductId: string, targetProductId: string) => {
    if (draggedProductId === targetProductId) return;

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const targetLocation = findProductLocation(newGroups, targetProductId);
      const draggedLocation = findProductLocation(newGroups, draggedProductId);

      if (
        !targetLocation ||
        targetLocation.sourceKind !== 'product' ||
        !draggedLocation ||
        draggedLocation.sourceKind !== 'product'
      ) {
        return prevGroups;
      }

      const draggedProduct = removeProductFromGroups(newGroups, draggedProductId);
      if (!draggedProduct) return prevGroups;

      const refreshedTargetLocation = findProductLocation(newGroups, targetProductId);
      if (!refreshedTargetLocation || refreshedTargetLocation.sourceKind !== 'product') {
        return prevGroups;
      }

      const targetProduct = newGroups[refreshedTargetLocation.groupIndex].products[refreshedTargetLocation.productIndex];
      targetProduct.addons = targetProduct.addons || [];

      if (targetProduct.addons.some(addon => addon.id === draggedProductId)) {
        return prevGroups;
      }

      targetProduct.addons.push(productToAddon(draggedProduct));
      return newGroups;
    });
  };

  const setPrimaryProduct = (groupId: string, productId: string, alternativeId: string | null) => {
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const group = newGroups.find(g => g.id === groupId);
      if (!group) return prevGroups;

      const product = group.products.find(p => p.id === productId);
      if (!product || !product.alternatives) return prevGroups;

      if (alternativeId === null) {
        // Make main product primary
        product.isPrimary = true;
        product.alternatives.forEach(alt => {
          alt.isPrimary = false;
        });
      } else {
        // Make alternative primary
        product.isPrimary = false;
        product.alternatives.forEach(alt => {
          alt.isPrimary = alt.id === alternativeId;
        });
      }

      return newGroups;
    });
  };

  const openRelatedItemEditor = (kind: RelatedItemKind, item: Alternative | Addon) => {
    setRelatedItemEditor({ kind, itemId: item.id });
    setRelatedItemDraft({
      sku: item.sku || '',
      name: item.name,
      quantity: String(item.quantity),
      price: String(item.price),
      discount: item.discount !== undefined ? String(item.discount) : '',
      comment: item.comment || '',
      isPrimary: kind === 'alternative' ? Boolean((item as Alternative).isPrimary) : false
    });
    setIsAddAlternativeMode(false);
    setIsAddAddonMode(false);
    setIsMoveToGroupMode(false);
    setIsProductActionsOpen(false);
  };

  const closeProductDrawer = () => {
    setSelectedProduct(null);
    setIsAddAlternativeMode(false);
    setIsAddAddonMode(false);
    setIsMoveToGroupMode(false);
    setIsProductActionsOpen(false);
    setProductSubscreen(null);
    setProductContentDraft(emptyProductContentDraft);
    setRelatedItemEditor(null);
    setRelatedItemDraft(emptyRelatedItemDraft);
    setAlternativeSource('offer');
  };

  const goBackInProductDrawer = () => {
    setIsProductActionsOpen(false);

    if (relatedItemEditor) {
      saveRelatedItemEdit(false);
      setRelatedItemEditor(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
      return;
    }

    if (productSubscreen) {
      setProductSubscreen(null);
      setProductContentDraft(emptyProductContentDraft);
      return;
    }

    setIsAddAlternativeMode(false);
    setIsAddAddonMode(false);
    setIsMoveToGroupMode(false);
    setAlternativeSource('offer');
  };

  const saveRelatedItemEdit = (closeAfterSave = false, draft = relatedItemDraft) => {
    if (!selectedProduct || !relatedItemEditor) return;

    const quantity = Number.parseFloat(draft.quantity.replace(',', '.')) || 0;
    const price = Number.parseFloat(draft.price.replace(',', '.')) || 0;
    const discountValue = draft.discount.trim()
      ? Number.parseFloat(draft.discount.replace(',', '.')) || 0
      : undefined;

    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === selectedProduct.groupId
          ? {
              ...group,
              products: group.products.map(product => {
                if (product.id !== selectedProduct.product.id) return product;

                if (relatedItemEditor.kind === 'alternative') {
                  return {
                    ...product,
                    isPrimary: draft.isPrimary ? false : product.isPrimary,
                    alternatives: product.alternatives?.map(alternative => ({
                      ...alternative,
                      sku: alternative.id === relatedItemEditor.itemId ? draft.sku.trim() || alternative.sku : alternative.sku,
                      name: alternative.id === relatedItemEditor.itemId ? draft.name.trim() || alternative.name : alternative.name,
                      quantity: alternative.id === relatedItemEditor.itemId ? quantity : alternative.quantity,
                      price: alternative.id === relatedItemEditor.itemId ? price : alternative.price,
                      discount: alternative.id === relatedItemEditor.itemId ? discountValue : alternative.discount,
                      comment: alternative.id === relatedItemEditor.itemId ? draft.comment : alternative.comment,
                      isPrimary: draft.isPrimary ? alternative.id === relatedItemEditor.itemId : alternative.isPrimary
                    }))
                  };
                }

                return {
                  ...product,
                  addons: product.addons?.map(addon =>
                    addon.id === relatedItemEditor.itemId
                      ? {
                          ...addon,
                          sku: draft.sku.trim() || addon.sku,
                          name: draft.name.trim() || addon.name,
                          quantity,
                          price,
                          discount: discountValue,
                          comment: draft.comment
                        }
                      : addon
                  )
                };
              })
            }
          : group
      )
    );

    if (closeAfterSave) {
      setRelatedItemEditor(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
    }
  };

  const returnRelatedItemToGroup = () => {
    if (!selectedProduct || !relatedItemEditor) return;

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const group = newGroups.find(currentGroup => currentGroup.id === selectedProduct.groupId);
      const productIndex = group?.products.findIndex(product => product.id === selectedProduct.product.id) ?? -1;

      if (!group || productIndex === -1) return prevGroups;

      const parentProduct = group.products[productIndex];

      if (relatedItemEditor.kind === 'alternative') {
        const alternativeIndex = parentProduct.alternatives?.findIndex(alternative => alternative.id === relatedItemEditor.itemId) ?? -1;
        if (alternativeIndex === -1 || !parentProduct.alternatives) return prevGroups;

        const [removedAlternative] = parentProduct.alternatives.splice(alternativeIndex, 1);
        if (removedAlternative.isPrimary) {
          parentProduct.isPrimary = true;
        }

        normalizeAlternativeProduct(parentProduct);
        group.products.splice(productIndex + 1, 0, alternativeToProduct(removedAlternative));
        return newGroups;
      }

      const addonIndex = parentProduct.addons?.findIndex(addon => addon.id === relatedItemEditor.itemId) ?? -1;
      if (addonIndex === -1 || !parentProduct.addons) return prevGroups;

      const [removedAddon] = parentProduct.addons.splice(addonIndex, 1);
      group.products.splice(productIndex + 1, 0, addonToProduct(removedAddon));
      return newGroups;
    });

    setRelatedItemEditor(null);
    setRelatedItemDraft(emptyRelatedItemDraft);
  };

  const addAlternativeManually = (targetProductId: string, _targetGroupId: string, sourceProductId: string, _sourceGroupId: string) => {
    const sourceProduct = groups
      .flatMap(group => group.products)
      .find(product => product.id === sourceProductId);

    addProductToAlternativeGroup(sourceProductId, targetProductId);
    setIsAddAlternativeMode(false);
    setAlternativeSource('offer');

    if (sourceProduct) {
      openRelatedItemEditor('alternative', productToAlternative(sourceProduct));
    }
  };

  const addAddonManually = (targetProductId: string, sourceProductId: string) => {
    const sourceProduct = groups
      .flatMap(group => group.products)
      .find(product => product.id === sourceProductId);

    addProductAsAddon(sourceProductId, targetProductId);
    setIsAddAddonMode(false);

    if (sourceProduct) {
      openRelatedItemEditor('addon', productToAddon(sourceProduct));
    }
  };

  const createNewAlternative = (targetProductId: string, targetGroupId: string) => {
    const newAlternative: Alternative = {
      id: `alt-${Date.now()}`,
      sku: 'NEW-ALT',
      name: 'Новая альтернатива',
      quantity: 1,
      price: 0,
      source: 'local',
      isPrimary: false
    };

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
      if (targetGroupIndex === -1) return prevGroups;

      const targetProduct = newGroups[targetGroupIndex].products.find(p => p.id === targetProductId);
      if (!targetProduct) return prevGroups;

      if (targetProduct.isPrimary === undefined) {
        targetProduct.isPrimary = true;
      }

      targetProduct.alternatives = targetProduct.alternatives || [];
      targetProduct.alternatives.push(newAlternative);

      return newGroups;
    });

    setIsAddAlternativeMode(false);
    setAlternativeSource('offer');
    openRelatedItemEditor('alternative', newAlternative);
  };

  const createNewAddon = (targetProductId: string, targetGroupId: string) => {
    const newAddon: Addon = {
      id: `addon-${Date.now()}`,
      sku: 'NEW-ADDON',
      name: 'Новый доп',
      quantity: 1,
      price: 0,
      source: 'local'
    };

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const targetGroup = newGroups.find(group => group.id === targetGroupId);
      const targetProduct = targetGroup?.products.find(product => product.id === targetProductId);

      if (!targetProduct) return prevGroups;

      targetProduct.addons = targetProduct.addons || [];
      targetProduct.addons.push(newAddon);
      return newGroups;
    });

    setIsAddAddonMode(false);
    openRelatedItemEditor('addon', newAddon);
  };

  const reorderProducts = (draggedProductId: string, targetProductId: string, targetGroupId: string, position: 'before' | 'after') => {
    setGroups(prevGroups => {
      if (draggedProductId === targetProductId) return prevGroups;

      const newGroups = cloneGroups(prevGroups);
      const draggedProduct = removeProductFromGroups(newGroups, draggedProductId);
      if (!draggedProduct) return prevGroups;

      const targetLocation = findProductLocation(newGroups, targetProductId);
      const targetGroupIndex = newGroups.findIndex(group => group.id === targetGroupId);
      if (!targetLocation || targetGroupIndex === -1) return prevGroups;

      const insertIndexBase = targetLocation.sourceKind === 'alternative'
        ? targetLocation.productIndex
        : targetLocation.productIndex;
      const insertIndex = position === 'before' ? insertIndexBase : insertIndexBase + 1;
      newGroups[targetGroupIndex].products.splice(insertIndex, 0, draggedProduct);
      return newGroups;
    });
  };

  const moveProductToGroup = (productId: string, _fromGroupId: string, toGroupId: string) => {
    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const toGroupIndex = newGroups.findIndex(g => g.id === toGroupId);

      if (toGroupIndex === -1) return prevGroups;

      const product = removeProductFromGroups(newGroups, productId);
      if (!product) return prevGroups;

      newGroups[toGroupIndex].products.push(product);

      return newGroups;
    });

    setSelectedProduct(null);
    setIsMoveToGroupMode(false);
    setIsProductActionsOpen(false);
  };

  const updateGroupDetails = (groupId: string, name: string, description: string) => {
    setGroups(prevGroups =>
      prevGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              name: name.trim() || g.name,
              description
            }
          : g
      )
    );
  };

  const openGroupEditDrawer = (group: ProductGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setEditingGroupComment(group.description);
    setGroupContextMenuId(null);
    setIsGroupEditDrawerOpen(true);
  };

  const closeGroupEditDrawer = () => {
    setIsGroupEditDrawerOpen(false);
    setEditingGroupId(null);
    setEditingGroupName('');
    setEditingGroupComment('');
  };

  const saveGroupEditDrawer = () => {
    if (!editingGroupId) return;
    updateGroupDetails(editingGroupId, editingGroupName, editingGroupComment);
    closeGroupEditDrawer();
  };

  const updateProductFields = (groupId: string, productId: string, fields: Partial<Product>) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              products: group.products.map(product =>
                product.id === productId ? { ...product, ...fields } : product
              )
            }
          : group
      )
    );
  };

  const parseDecimalInput = (value: string, fallback = 0) => {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const openProductContentScreen = (product: Product) => {
    setProductContentDraft({
      shortDescription: product.shortDescription || '',
      fullDescription: product.fullDescription || '',
      link: product.link || ''
    });
    setProductSubscreen('content');
    setIsAddAlternativeMode(false);
    setIsAddAddonMode(false);
    setIsMoveToGroupMode(false);
    setIsProductActionsOpen(false);
    setRelatedItemEditor(null);
  };

  const saveProductFullDescription = () => {
    if (!selectedProduct || !selectedProductModel) return;

    updateProductFields(selectedProduct.groupId, selectedProductModel.id, {
      shortDescription: productContentDraft.shortDescription,
      fullDescription: productContentDraft.fullDescription,
      link: productContentDraft.link
    });
    setProductSubscreen(null);
  };

  const getAllAvailableProducts = (excludeProductId: string, excludeGroupId: string) => {
    const available: Array<{ product: Product; groupId: string; groupName: string }> = [];

    const mainProduct = groups
      .find(g => g.id === excludeGroupId)
      ?.products.find(p => p.id === excludeProductId);

    const existingAlternativeIds = mainProduct?.alternatives?.map(alt => alt.id) || [];
    const existingAddonIds = mainProduct?.addons?.map(addon => addon.id) || [];

    groups.forEach(group => {
      group.products.forEach(product => {
        if (
          product.id !== excludeProductId &&
          !existingAlternativeIds.includes(product.id) &&
          !existingAddonIds.includes(product.id)
        ) {
          available.push({
            product,
            groupId: group.id,
            groupName: group.name
          });
        }
      });
    });

    return available;
  };

  const getPiggyAdjustment = (productId: string): PiggyAdjustment =>
    piggyAdjustments[productId] ?? { writeOff: '', markup: '' };

  const updatePiggyAdjustment = (productId: string, field: keyof PiggyAdjustment, value: string) => {
    setPiggyAdjustments(prev => ({
      ...prev,
      [productId]: {
        ...getPiggyAdjustment(productId),
        [field]: value
      }
    }));
  };

  const openOfferDescriptionDrawer = () => {
    setEditingOfferTitle(offerTitle);
    setEditingOfferDescription(offerDescription);
    setIsOfferDescriptionDrawerOpen(true);
  };

  const closeOfferDescriptionDrawer = () => {
    setIsOfferDescriptionDrawerOpen(false);
    setEditingOfferTitle('');
    setEditingOfferDescription('');
  };

  const saveOfferDescription = () => {
    setOfferTitle(editingOfferTitle);
    setOfferDescription(editingOfferDescription);
    closeOfferDescriptionDrawer();
  };

  const offerStatus = offerStatusOptions.find(status => status.id === offerStatusId) ?? offerStatusOptions[0];
  const offerStatusStyle = offerStatusToneClasses[offerStatus.tone];
  const updatedProductsCount = groups.reduce(
    (count, group) => count + group.products.filter(product => product.hasUpdates).length,
    0
  );
  const updatedDeliveriesCount = 0;
  const updatedPaymentsCount = 0;
  const deliveriesCount: number = 2;
  const paymentsCount: number = 1;
  const hasClient = false;
  const hasUpdates = updatedProductsCount + updatedDeliveriesCount + updatedPaymentsCount > 0;
  const hasResponsibleManager = true;
  const offerIssuesCount = (hasUpdates ? 1 : 0) + (!hasResponsibleManager ? 1 : 0);
  const hasOfferIssues = offerIssuesCount > 0;
  const offerIssuesTone = !hasResponsibleManager ? 'critical' : 'warning';
  const selectedProductModel = selectedProduct
    ? groups
        .find(group => group.id === selectedProduct.groupId)
        ?.products.find(product => product.id === selectedProduct.product.id) ?? selectedProduct.product
    : null;
  const selectedRelatedItem = relatedItemEditor && selectedProductModel
    ? relatedItemEditor.kind === 'alternative'
      ? selectedProductModel.alternatives?.find(alternative => alternative.id === relatedItemEditor.itemId)
      : selectedProductModel.addons?.find(addon => addon.id === relatedItemEditor.itemId)
    : null;
  const activePiggyItemId = relatedItemEditor?.itemId ?? selectedProductModel?.id;
  const selectedPiggyAdjustment = activePiggyItemId
    ? getPiggyAdjustment(activePiggyItemId)
    : { writeOff: '', markup: '' };
  const isProductDrawerSubscreen = Boolean(relatedItemEditor || productSubscreen || isAddAlternativeMode || isAddAddonMode || isMoveToGroupMode);
  const productDrawerTitle = relatedItemEditor
    ? relatedItemEditor.kind === 'alternative'
      ? 'Альтернатива'
      : 'Доп к товару'
    : isMoveToGroupMode
      ? 'Переместить в группу'
      : isAddAlternativeMode
        ? 'Добавить альтернативу'
        : isAddAddonMode
          ? 'Добавить доп'
          : productSubscreen === 'comment'
            ? 'Комментарий клиенту'
            : productSubscreen === 'content'
              ? 'Контент товара'
              : productSubscreen === 'alternatives'
                ? 'Альтернативы'
                : productSubscreen === 'addons'
                  ? 'Допы'
                  : 'Товар';
  const selectedProductDiscount = selectedProductModel?.discount ?? 0;
  const selectedProductUnitPriceWithDiscount = selectedProductModel
    ? selectedProductModel.price * (1 - selectedProductDiscount / 100)
    : 0;
  const selectedProductTotal = selectedProductModel
    ? selectedProductUnitPriceWithDiscount * selectedProductModel.quantity
    : 0;
  const piggyAvailableAmount = 52000;
  const selectedPiggyWriteOffAmount = selectedPiggyAdjustment.writeOff.trim()
    ? parseDecimalInput(selectedPiggyAdjustment.writeOff)
    : 0;
  const selectedPiggyMarkupAmount = selectedPiggyAdjustment.markup.trim()
    ? parseDecimalInput(selectedPiggyAdjustment.markup)
    : 0;
  const selectedPiggyPositionAmount = selectedPiggyWriteOffAmount - selectedPiggyMarkupAmount;
  const selectedProductPiggyEnabled = Boolean(
    selectedProductModel?.piggyEnabled ||
    selectedPiggyAdjustment.writeOff ||
    selectedPiggyAdjustment.markup
  );
  const selectedProductClientCommentEnabled = Boolean(
    selectedProductModel?.clientCommentEnabled ?? selectedProductModel?.comment
  );
  const selectedProductContentFilledCount = selectedProductModel
    ? [
        selectedProductModel.shortDescription,
        selectedProductModel.fullDescription,
        selectedProductModel.link
      ].filter(value => Boolean(value?.trim())).length
    : 0;
  const hasOfferDescription = Boolean(offerTitle.trim() && offerDescription.trim());
  const hasDeliveryProblems = updatedDeliveriesCount > 0;
  const hasPaymentProblems = updatedPaymentsCount > 0;
  const activeGroupId = pinnedGroupId || currentGroupId || visibleGroups[0]?.id;
  const pinnedGroup = groups.find(group => group.id === pinnedGroupId);
  const stickyGroupTop = headerVisible ? COLLAPSIBLE_HEADER_HEIGHT : 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
      {/* Global DnD Tooltip */}
      {dragTooltip && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-[#222934] text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {dragTooltip}
          </div>
        </div>
      )}

      {/* Header - Slides up/down */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white transition-transform duration-300 ease-in-out"
        style={{
          transform: headerVisible ? 'translateY(0)' : `translateY(-${COLLAPSIBLE_HEADER_HEIGHT}px)`
        }}
      >
        {/* Header */}
        <header className="border-b border-[rgba(13,45,94,0.08)] px-3 py-2">
          <div className="flex h-9 min-w-0 items-center gap-1.5">
            <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]">
              <ChevronLeft className="w-5 h-5 text-[#0D2D5E]" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex-shrink-0 text-[17px] font-bold text-[#222934]">995-100</span>
              <div className="relative min-w-0 flex-1">
                <button
                  onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  className={`flex h-7 max-w-full min-w-0 items-center gap-1 rounded-full px-2 text-[12px] font-medium ${offerStatusStyle.pill}`}
                  aria-expanded={isStatusDropdownOpen}
                  aria-label={`Статус оффера: ${offerStatus.label}`}
                >
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${offerStatusStyle.dot}`} />
                  <span className="min-w-0 truncate">{offerStatus.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                </button>
                {isStatusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsStatusDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-[rgba(13,45,94,0.08)] bg-white py-1 shadow-lg">
                      {offerStatusOptions.map(status => {
                        const statusStyle = offerStatusToneClasses[status.tone];
                        const isSelected = status.id === offerStatus.id;

                        return (
                          <button
                            key={status.id}
                            onClick={() => {
                              setOfferStatusId(status.id);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`flex h-10 w-full items-center gap-2 px-3 text-left text-[14px] font-medium ${
                              isSelected
                                ? 'bg-[rgba(13,45,94,0.04)] text-[#222934]'
                                : 'text-[rgba(13,45,94,0.72)] hover:bg-[rgba(13,45,94,0.04)]'
                            }`}
                          >
                            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusStyle.itemDot}`} />
                            <span className="min-w-0 flex-1 truncate">{status.label}</span>
                            {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-[#007FFF]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {hasOfferIssues && (
                <button
                  onClick={() => {
                    setIsStatusDropdownOpen(false);
                    setIsOfferIssuesOpen(true);
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    offerIssuesTone === 'critical'
                      ? 'bg-[#FFF1F0] hover:bg-[#FFE5E2]'
                      : 'bg-[#FFF7E6] hover:bg-[#FFECC7]'
                  }`}
                  aria-label={`Проблемы оффера: ${offerIssuesCount}`}
                >
                  <TriangleAlert className={`h-5 w-5 ${offerIssuesTone === 'critical' ? 'text-[#EC3F39]' : 'text-[#F59E0B]'}`} />
                  {offerIssuesCount > 1 && (
                    <span className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white ${
                      offerIssuesTone === 'critical' ? 'bg-[#EC3F39]' : 'bg-[#F59E0B]'
                    }`}>
                      {offerIssuesCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setIsStatusDropdownOpen(false);
                  setIsOfferMenuOpen(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]"
                aria-label="Меню"
              >
                <MoreVertical className="w-5 h-5 text-[#0D2D5E] opacity-56" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-3 pb-1.5 pt-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setIsClientDrawerOpen(true)}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                hasClient
                  ? 'border-[rgba(13,45,94,0.08)] bg-white text-[#222934] hover:bg-[rgba(13,45,94,0.03)]'
                  : 'border-dashed border-[rgba(13,45,94,0.22)] bg-white text-[rgba(13,45,94,0.72)] hover:bg-[rgba(0,127,255,0.06)]'
              }`}
            >
              {!hasClient && <span className="text-[#007FFF]">+</span>}
              <span>Клиент</span>
            </button>

            <button
              type="button"
              onClick={openOfferDescriptionDrawer}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                hasOfferDescription
                  ? 'border-[rgba(13,45,94,0.08)] bg-white text-[#222934] hover:bg-[rgba(13,45,94,0.03)]'
                  : 'border-dashed border-[rgba(13,45,94,0.22)] bg-white text-[rgba(13,45,94,0.72)] hover:bg-[rgba(0,127,255,0.06)]'
              }`}
            >
              {!hasOfferDescription && <span className="text-[#007FFF]">+</span>}
              <span>Описание</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeliveryDrawerOpen(true)}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                deliveriesCount > 0
                  ? 'border-[rgba(13,45,94,0.08)] bg-white text-[#222934] hover:bg-[rgba(13,45,94,0.03)]'
                  : 'border-dashed border-[rgba(13,45,94,0.22)] bg-white text-[rgba(13,45,94,0.72)] hover:bg-[rgba(0,127,255,0.06)]'
              }`}
            >
              {deliveriesCount === 0 && <span className="text-[#007FFF]">+</span>}
              <span>Доставка</span>
              {deliveriesCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[11px] font-bold text-[rgba(13,45,94,0.64)]">
                  {deliveriesCount}
                </span>
              )}
              {hasDeliveryProblems && <span className="h-1.5 w-1.5 rounded-full bg-[#EC3F39]" />}
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentDrawerOpen(true)}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                paymentsCount > 0
                  ? 'border-[rgba(13,45,94,0.08)] bg-white text-[#222934] hover:bg-[rgba(13,45,94,0.03)]'
                  : 'border-dashed border-[rgba(13,45,94,0.22)] bg-white text-[rgba(13,45,94,0.72)] hover:bg-[rgba(0,127,255,0.06)]'
              }`}
            >
              {paymentsCount === 0 && <span className="text-[#007FFF]">+</span>}
              <span>Оплата</span>
              {paymentsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[11px] font-bold text-[rgba(13,45,94,0.64)]">
                  {paymentsCount}
                </span>
              )}
              {hasPaymentProblems && <span className="h-1.5 w-1.5 rounded-full bg-[#EC3F39]" />}
            </button>
          </div>
        </div>
      </div>

      {pinnedGroup && (
        <DroppableGroupHeader
          groupId={pinnedGroup.id}
          onProductDrop={moveProductToGroup}
          setDragTooltip={setDragTooltip}
          className="fixed left-0 right-0 z-30 shadow-[0_4px_14px_rgba(13,45,94,0.08)] transition-[top,background-color]"
          style={{ top: stickyGroupTop }}
        >
          <div className="px-3 py-2">
            <div className="flex h-10 items-center gap-1.5">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsGroupDrawerOpen(true);
                }}
                className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 text-left hover:bg-[rgba(13,45,94,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007FFF]/30"
                aria-label={`Открыть список групп. Текущая группа ${pinnedGroup.name}`}
              >
                <h3 className="truncate text-[16px] font-bold text-[#222934]">
                  {pinnedGroup.name}
                </h3>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-[rgba(13,45,94,0.56)]" />
              </button>
              <div className="flex h-7 min-w-7 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-2 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                {getGroupProductCount(pinnedGroup)}
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setGroupContextMenuId(pinnedGroup.id);
                }}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]"
                aria-label={`Меню группы ${pinnedGroup.name}`}
              >
                <MoreVertical className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
              </button>
            </div>
          </div>
        </DroppableGroupHeader>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-24"
        style={{
          paddingTop: `${COLLAPSIBLE_HEADER_HEIGHT}px`
        }}
      >
        <section className="pt-1">
          <div className="space-y-2">
            {visibleGroups.map((group, groupIndex) => (
              <DraggableGroupContent
                key={group.id}
                index={groupIndex}
                moveGroup={moveGroup}
              >
              <div
                ref={(el) => (groupRefs.current[group.id] = el)}
                className="bg-white rounded-2xl"
              >
                {/* Group Header */}
                <DroppableGroupHeader
                  groupId={group.id}
                  onProductDrop={moveProductToGroup}
                  setDragTooltip={setDragTooltip}
                  className={`relative rounded-t-2xl ${pinnedGroupId === group.id ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <div className="px-3 py-2">
                    <div className="flex h-10 items-center gap-1.5">
                      <div className="flex h-9 min-w-0 flex-1 items-center px-1">
                        <h3 className="truncate text-[16px] font-bold text-[#222934]">
                          {group.name}
                        </h3>
                      </div>
                      <div className="flex h-7 min-w-7 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-2 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                        {getGroupProductCount(group)}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setGroupContextMenuId(group.id);
                        }}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]"
                        aria-label={`Меню группы ${group.name}`}
                      >
                        <MoreVertical className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                      </button>
                    </div>
                  </div>
                </DroppableGroupHeader>
                {group.description && (
                  <p className="px-4 pb-3 pt-2 text-[14px] text-[rgba(37,52,71,0.84)] leading-[18px]">
                    {group.description}
                  </p>
                )}

                {/* Products */}
                <div className="space-y-2">
                    {group.products.map((product, productIndex) => (
                      <div key={product.id}>
                        <DraggableProduct
                          product={product}
                          groupId={group.id}
                          index={productIndex}
                          onMakeAddon={addProductAsAddon}
                          onReorder={reorderProducts}
                          onClick={() => setSelectedProduct({ product, groupId: group.id })}
                          setDragTooltip={setDragTooltip}
                        >
                          <div className="bg-white border-t border-[rgba(13,45,94,0.08)] p-4">
                            <div className="flex gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[rgba(13,45,94,0.04)] flex-shrink-0 border border-[rgba(13,45,94,0.08)]">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-4 h-4 text-[rgba(13,45,94,0.28)]">📦</div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[14px] text-[rgba(13,45,94,0.56)]">1.1</span>
                                  <span className="text-[14px] text-[rgba(13,45,94,0.56)]">{product.sku}</span>
                                  {product.hasUpdates && (
                                    <div className="w-2 h-2 rounded-full bg-[#EC3F39]" />
                                  )}
                                </div>
                                <h4 className="text-[16px] font-medium text-[#222934] leading-[20px] mb-2">
                                  {product.name}
                                </h4>
                                {product.comment && (
                                  <p className="text-[14px] text-[rgba(37,52,71,0.84)] leading-[18px] mb-2">
                                    {product.comment}
                                  </p>
                                )}
                                {((product.alternatives?.length ?? 0) > 0 || (product.addons?.length ?? 0) > 0) && (
                                  <div className="mb-2 flex flex-wrap gap-1.5">
                                    {(product.alternatives?.length ?? 0) > 0 && (
                                      <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[rgba(13,45,94,0.64)]">
                                        Альтернатив: {product.alternatives?.length}
                                      </span>
                                    )}
                                    {(product.addons?.length ?? 0) > 0 && (
                                      <span className="rounded-full bg-[#FFF7E6] px-2 py-1 text-[12px] font-medium text-[#B7791F]">
                                        Допов: {product.addons?.length}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-baseline justify-between">
                                  <span className="text-[14px] font-medium text-[#222934]">
                                    {product.quantity} шт.
                                  </span>
                                  <div className="flex items-baseline gap-2">
                                    {product.discount && (
                                      <span className="text-[14px] text-[rgba(13,45,94,0.56)]">
                                        -{product.discount.toFixed(2)}%
                                      </span>
                                    )}
                                    <span className="text-[16px] font-bold text-[#222934]">
                                      {(product.price * product.quantity * (1 - (product.discount || 0) / 100)).toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DraggableProduct>
                      </div>
                    ))}

                    {/* Group Total */}
                    <div className="px-4 py-3 flex flex-col gap-1 items-end">
                      {calculateGroupDiscount(group) > 0 && (
                        <div className="flex items-center gap-1 text-[14px] text-[rgba(13,45,94,0.56)]">
                          -{calculateGroupDiscount(group).toFixed(2)}%
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex-shrink-0">
                          <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                            <path clipRule="evenodd" d={svgPaths.p180e1000} fill="#EC3F39" fillRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[20px] font-bold text-[#222934] leading-[20px]" style={{ fontFeatureSettings: "'lnum', 'tnum'" }}>
                          {calculateGroupTotal(group).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>

                    {/* Add Item Buttons */}
                    <div className="px-2 pb-2">
                      <div className="flex gap-1">
                        <button className="flex-1 h-10 bg-[rgba(0,127,255,0.08)] rounded-[10px] flex items-center justify-center gap-2 hover:bg-[rgba(0,127,255,0.12)] transition-colors">
                          <div className="w-4 h-4">
                            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.7681 13.7681">
                              <path clipRule="evenodd" d={svgPaths.p1107c200} fill="#007FFF" fillRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-[16px] font-medium text-[#007FFF] leading-[20px]">Выбрать позиции</span>
                        </button>
                        <button
                          onClick={() => addNewProduct(group.id)}
                          className="flex-1 h-10 rounded-[10px] flex items-center justify-center gap-2 hover:bg-[rgba(0,127,255,0.08)] transition-colors"
                        >
                          <div className="w-4 h-4">
                            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 12.5">
                              <path clipRule="evenodd" d={svgPaths.p37d81b00} fill="#007FFF" fillRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-[16px] font-medium text-[#007FFF] leading-[20px]">Новый товар</span>
                        </button>
                      </div>
                    </div>
                </div>
              </div>
              </DraggableGroupContent>
            ))}

            {/* Add New Group Button */}
            <div className="px-4 py-2">
              <button
                onClick={addNewGroup}
                className="w-full h-10 rounded-[10px] flex items-center justify-center gap-2 hover:bg-[rgba(0,127,255,0.08)] transition-colors"
              >
                <div className="w-4 h-4">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 12.5">
                    <path clipRule="evenodd" d={svgPaths.p37d81b00} fill="#007FFF" fillRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[16px] font-medium text-[#007FFF] leading-[20px]">Новая группа</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        background: 'linear-gradient(90deg, rgba(13, 45, 94, 0.28) 0%, rgba(13, 45, 94, 0.28) 100%), linear-gradient(90deg, rgb(62, 71, 86) 0%, rgb(62, 71, 86) 100%)'
      }}>
        <div className="px-4 py-3 flex flex-col gap-2">
          {/* Piggy Bank Details - Expandable */}
          {isPiggyExpanded && (
            <>
              <div className="flex flex-col gap-1 text-white text-[14px]">
                <div className="flex items-center justify-between">
                  <span>Накопили</span>
                  <span>0,00 ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Списали</span>
                  <span>0,00 ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Осталось</span>
                  <span>0,00 ₽</span>
                </div>
              </div>
              <div className="h-px bg-white/8 rounded" />
            </>
          )}

          {/* Main Footer Content */}
          <div className="flex items-center gap-2 h-10">
            {/* Left Side - Amounts */}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 flex-shrink-0">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.25 12.25">
                    <path clipRule="evenodd" d={svgPaths.p3bc5ae80} fill="#3CAA3C" fillRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[14px] font-bold text-[#3CAA3C] leading-[18px]">52 000,00 ₽</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold text-white leading-[20px]">{formattedTotalAmount} ₽</span>
                <div className="w-3.5 h-3.5 flex-shrink-0">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.25 12.25">
                    <path clipRule="evenodd" d={svgPaths.p3ccb1a80} fill="#EC3F39" fillRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-full bg-white/8 rounded" />

            {/* Piggy Bank Button */}
            <button
              onClick={() => setIsPiggyExpanded(!isPiggyExpanded)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Копилка: есть остаток для распределения"
            >
              <div className="w-5 h-5">
                <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.8752 18.75">
                  <g>
                    <path d={svgPaths.p49e3f80} fill="white" />
                    <path clipRule="evenodd" d={svgPaths.p3396da00} fill="white" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF9800] text-[12px] font-bold leading-none text-white ring-2 ring-[#344154]">
                +
              </span>
            </button>

            {/* Divider */}
            <div className="w-px h-full bg-white/8 rounded" />

            {/* Publish Button */}
            <button className="flex items-center justify-center w-10 h-10 bg-[#007FFF] rounded-[10px] hover:bg-[#0066CC] transition-colors">
              <div className="w-5 h-5">
                <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 16.4175">
                  <path clipRule="evenodd" d={svgPaths.p311a4f00} fill="white" fillRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Client Drawer */}
      {isClientDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsClientDrawerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[82vh] flex-col rounded-t-2xl bg-white">
            <div className="border-b border-[rgba(13,45,94,0.08)] px-4 py-3">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[rgba(13,45,94,0.16)]" />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-bold text-[#222934]">Клиент</h3>
                <button
                  onClick={() => setIsClientDrawerOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                  aria-label="Закрыть выбор клиента"
                >
                  <X className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                    Поиск клиента
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(13,45,94,0.48)]" />
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.16)] bg-white pl-10 pr-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="Название, ИНН или телефон"
                    />
                  </div>
                </label>

                <button className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[rgba(13,45,94,0.18)] bg-[#F8FAFC] p-3 text-left transition-colors hover:bg-[#EEF6FF]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
                    <UserRound className="h-[18px] w-[18px] text-[#007FFF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#222934]">Выбрать клиента</div>
                    <div className="mt-0.5 text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                      Сейчас клиент не указан
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[13px] font-semibold text-[#007FFF]">Выбрать</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delivery Drawer */}
      {isDeliveryDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsDeliveryDrawerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[82vh] flex-col rounded-t-2xl bg-white">
            <div className="border-b border-[rgba(13,45,94,0.08)] px-4 py-3">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[rgba(13,45,94,0.16)]" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="text-[18px] font-bold text-[#222934]">Доставка</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[11px] font-bold text-[rgba(13,45,94,0.64)]">
                    {deliveriesCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsDeliveryDrawerOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                  aria-label="Закрыть доставки"
                >
                  <X className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 text-left transition-colors hover:bg-[rgba(13,45,94,0.03)]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
                    <Truck className="h-[18px] w-[18px] text-[#007FFF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#222934]">Доставка транспортной компанией</div>
                    <div className="mt-0.5 text-[13px] font-medium text-[rgba(13,45,94,0.56)]">По тарифам компании</div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#007FFF]">Изменить</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 text-left transition-colors hover:bg-[rgba(13,45,94,0.03)]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
                    <Truck className="h-[18px] w-[18px] text-[#007FFF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#222934]">Самовывоз</div>
                    <div className="mt-0.5 text-[13px] font-medium text-[rgba(13,45,94,0.56)]">Со склада поставщика</div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#007FFF]">Изменить</span>
                </button>
              </div>
            </div>
            <div className="border-t border-[rgba(13,45,94,0.08)] p-3">
              <button className="flex h-11 w-full items-center justify-center rounded-lg bg-[#EEF6FF] px-4 text-[15px] font-semibold text-[#007FFF]">
                + Добавить доставку
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payment Drawer */}
      {isPaymentDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsPaymentDrawerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[82vh] flex-col rounded-t-2xl bg-white">
            <div className="border-b border-[rgba(13,45,94,0.08)] px-4 py-3">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[rgba(13,45,94,0.16)]" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="text-[18px] font-bold text-[#222934]">Оплата</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[11px] font-bold text-[rgba(13,45,94,0.64)]">
                    {paymentsCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsPaymentDrawerOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                  aria-label="Закрыть оплаты"
                >
                  <X className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 text-left transition-colors hover:bg-[rgba(13,45,94,0.03)]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
                    <CreditCard className="h-[18px] w-[18px] text-[#007FFF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#222934]">Безналичная оплата</div>
                    <div className="mt-0.5 text-[13px] font-medium text-[rgba(13,45,94,0.56)]">Счет для юридического лица</div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#007FFF]">Изменить</span>
                </button>
              </div>
            </div>
            <div className="border-t border-[rgba(13,45,94,0.08)] p-3">
              <button className="flex h-11 w-full items-center justify-center rounded-lg bg-[#EEF6FF] px-4 text-[15px] font-semibold text-[#007FFF]">
                + Добавить оплату
              </button>
            </div>
          </div>
        </>
      )}

      {/* Offer Title and Description Drawer */}
      {isOfferDescriptionDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeOfferDescriptionDrawer}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[88vh] flex-col rounded-t-2xl bg-white">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-bold text-[#222934]">Заголовок и описание</h3>
                <button
                  onClick={closeOfferDescriptionDrawer}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть редактирование описания"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <label htmlFor="offer-title" className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                    Заголовок
                  </span>
                  <input
                    id="offer-title"
                    type="text"
                    value={editingOfferTitle}
                    onChange={(event) => setEditingOfferTitle(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.16)] bg-white px-3 text-[16px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                    placeholder="Заголовок оффера"
                    autoFocus
                  />
                </label>

                <label htmlFor="offer-description" className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                    Описание
                  </span>
                  <textarea
                    id="offer-description"
                    aria-label="Описание"
                    value={editingOfferDescription}
                    onChange={(event) => setEditingOfferDescription(event.target.value)}
                    className="min-h-56 max-h-[52vh] w-full resize-none rounded-lg border border-[rgba(13,45,94,0.16)] bg-white px-3 py-2 text-[15px] leading-5 text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                    placeholder="Описание оффера"
                  />
                </label>
              </div>
            </div>
            <div className="border-t border-[rgba(13,45,94,0.08)] p-4">
              <div className="flex gap-2">
                <button
                  onClick={closeOfferDescriptionDrawer}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[rgba(13,45,94,0.04)] px-4 text-[15px] font-semibold text-[#222934]"
                >
                  Отмена
                </button>
                <button
                  onClick={saveOfferDescription}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#007FFF] px-4 text-[15px] font-semibold text-white"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Group Context Menu */}
      {groupContextMenu && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setGroupContextMenuId(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-white">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[18px] font-bold text-[#222934]">{groupContextMenu.name}</h3>
                  <p className="mt-1 text-[14px] text-[rgba(13,45,94,0.56)]">
                    {getGroupProductCount(groupContextMenu)} позиций
                  </p>
                </div>
                <button
                  onClick={() => setGroupContextMenuId(null)}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть меню группы"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => openGroupEditDrawer(groupContextMenu)}
                className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-[rgba(13,45,94,0.04)]"
              >
                <Edit2 className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                <span className="text-[16px] font-medium text-[#222934]">Редактировать группу</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Group Edit Drawer */}
      {isGroupEditDrawerOpen && editingGroup && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeGroupEditDrawer}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[86vh] flex-col rounded-t-2xl bg-white">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-[#222934]">Редактировать группу</h3>
                  <p className="mt-1 truncate text-[14px] text-[rgba(13,45,94,0.56)]">{editingGroup.name}</p>
                </div>
                <button
                  onClick={closeGroupEditDrawer}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть редактирование группы"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <label htmlFor="group-edit-name" className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                    Название
                  </span>
                  <input
                    id="group-edit-name"
                    type="text"
                    value={editingGroupName}
                    onChange={(event) => setEditingGroupName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.16)] bg-white px-3 text-[16px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                    placeholder="Название группы"
                    autoFocus
                  />
                </label>

                <label htmlFor="group-edit-comment" className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                    Комментарий для клиента
                  </span>
                  <textarea
                    id="group-edit-comment"
                    aria-label="Комментарий для клиента"
                    value={editingGroupComment}
                    onChange={(event) => setEditingGroupComment(event.target.value)}
                    className="min-h-36 max-h-72 w-full resize-none rounded-lg border border-[rgba(13,45,94,0.16)] bg-white px-3 py-2 text-[15px] leading-5 text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                    placeholder="Комментарий будет показан клиенту"
                  />
                  <span className="mt-1.5 block text-[12px] leading-4 text-[rgba(13,45,94,0.48)]">
                    Поле поддерживает длинный текст. Если комментарий большой, drawer прокручивается.
                  </span>
                </label>
              </div>
            </div>
            <div className="border-t border-[rgba(13,45,94,0.08)] p-4">
              <div className="flex gap-2">
                <button
                  onClick={closeGroupEditDrawer}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[rgba(13,45,94,0.04)] px-4 text-[15px] font-semibold text-[#222934]"
                >
                  Отмена
                </button>
                <button
                  onClick={saveGroupEditDrawer}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#007FFF] px-4 text-[15px] font-semibold text-white"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Offer Context Menu */}
      {isOfferMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOfferMenuOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#222934]">Оффер 995-100</h3>
                  <p className="text-[14px] text-[rgba(13,45,94,0.56)] mt-1">{offerStatus.label}</p>
                </div>
                <button
                  onClick={() => setIsOfferMenuOpen(false)}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть меню"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="p-2">
              <button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[rgba(13,45,94,0.04)]">
                <div>
                  <div className="text-[16px] font-medium text-[#222934]">Ответственные</div>
                  <div className="text-[13px] text-[rgba(13,45,94,0.56)]">Менеджер и участники оффера</div>
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                    <img src={imgAvatar} alt="Анна" className="h-full w-full object-cover" />
                  </div>
                  <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[rgba(13,45,94,0.08)]">
                    <span className="text-[10px] font-medium text-[rgba(13,45,94,0.56)]">+2</span>
                  </div>
                </div>
              </button>
              <button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[rgba(13,45,94,0.04)]">
                <span className="text-[16px] font-medium text-[#222934]">История изменений</span>
                {hasUpdates && <span className="h-2 w-2 rounded-full bg-[#EC3F39]" />}
              </button>
              <button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[rgba(13,45,94,0.04)]">
                <span className="text-[16px] font-medium text-[#222934]">Настройки оффера</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Offer Issues */}
      {isOfferIssuesOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOfferIssuesOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                    offerIssuesTone === 'critical' ? 'bg-[#FFF1F0]' : 'bg-[#FFF7E6]'
                  }`}>
                    <TriangleAlert className={`h-5 w-5 ${offerIssuesTone === 'critical' ? 'text-[#EC3F39]' : 'text-[#F59E0B]'}`} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#222934]">Проблемы оффера</h3>
                  <p className="text-[14px] text-[rgba(13,45,94,0.56)] mt-1">
                    Проверьте перед публикацией или закрытием.
                  </p>
                </div>
                <button
                  onClick={() => setIsOfferIssuesOpen(false)}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть проблемы"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="p-2">
              {hasUpdates && (
                <div className="rounded-xl px-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7E6]">
                      <RotateCcw className="h-5 w-5 text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-semibold text-[#222934]">Есть изменения для отката</div>
                      <div className="mt-1 text-[13px] leading-4 text-[rgba(13,45,94,0.56)]">
                        В оффере есть обновления в связанных сущностях. Можно открыть историю и решить, что откатывать.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[#222934]">
                          Товары {updatedProductsCount}
                        </span>
                        <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                          Доставки {updatedDeliveriesCount}
                        </span>
                        <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                          Оплаты {updatedPaymentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!hasResponsibleManager && (
                <div className="rounded-xl px-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF1F0]">
                      <User className="h-5 w-5 text-[#EC3F39]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-semibold text-[#222934]">Нет главного менеджера</div>
                      <div className="mt-1 text-[13px] leading-4 text-[rgba(13,45,94,0.56)]">
                        Оффер остался без ответственного. Назначьте главного менеджера в участниках.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2 px-3 pb-3 pt-1">
                <button className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#EEF6FF] px-3 text-[14px] font-semibold text-[#007FFF]">
                  История изменений
                </button>
                <button
                  onClick={() => {
                    setIsOfferIssuesOpen(false);
                    setIsOfferMenuOpen(true);
                  }}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[rgba(13,45,94,0.04)] px-3 text-[14px] font-semibold text-[#222934]"
                >
                  Участники
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Group Navigation Drawer */}
      {isGroupDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsGroupDrawerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-[rgba(13,45,94,0.08)]">
              <div className="w-12 h-1 bg-[rgba(13,45,94,0.16)] rounded-full mx-auto mb-3" />
              <h3 className="text-[18px] font-bold text-[#222934]">Группы товаров</h3>
              <p className="text-[14px] text-[rgba(13,45,94,0.56)] mt-1">
                Перетащите для изменения порядка
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {groups.map((group, index) => (
                <DraggableGroup
                  key={group.id}
                  group={group}
                  index={index}
                  isSelected={group.id === activeGroupId}
                  moveGroup={moveGroup}
                  onSelectGroup={scrollToGroup}
                />
              ))}
            </div>
            <div className="p-4 border-t border-[rgba(13,45,94,0.08)]">
              <button
                onClick={() => {
                  addNewGroup();
                  setIsGroupDrawerOpen(false);
                }}
                className="w-full h-8 rounded-[10px] flex items-center justify-center gap-2 hover:bg-[rgba(0,127,255,0.08)] transition-colors"
              >
                <div className="w-4 h-4">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 12.5">
                    <path clipRule="evenodd" d={svgPaths.p37d81b00} fill="#007FFF" fillRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[16px] font-medium text-[#007FFF] leading-[20px]">Новая группа</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Product Details Drawer */}
      {selectedProduct && selectedProductModel && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeProductDrawer}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className={`relative border-b border-[rgba(13,45,94,0.08)] ${isProductDrawerSubscreen ? 'px-4 py-3' : 'min-h-10 px-4 pb-2 pt-2'}`}>
              <div className={`mx-auto h-1 w-12 rounded-full bg-[rgba(13,45,94,0.16)] ${isProductDrawerSubscreen ? 'mb-3' : ''}`} />
              {isProductDrawerSubscreen ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      onClick={goBackInProductDrawer}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]"
                      aria-label="Назад к товару"
                    >
                      <ChevronLeft className="h-5 w-5 text-[#0D2D5E]" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-bold text-[#222934]">
                        {productDrawerTitle}
                      </h3>
                      <div className="truncate text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                        К товару: {selectedProductModel.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeProductDrawer}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)] transition-colors"
                    aria-label="Закрыть дровер товара"
                  >
                    <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={closeProductDrawer}
                  className="absolute right-3 top-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)] transition-colors"
                  aria-label="Закрыть дровер товара"
                >
                  <X className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              )}
            </div>

            {isAddAlternativeMode && (
              <div className="flex border-b border-[rgba(13,45,94,0.08)]">
                <button
                  onClick={() => setAlternativeSource('offer')}
                  className={`flex-1 px-4 py-3 text-[14px] font-medium relative ${
                    alternativeSource === 'offer'
                      ? 'text-[#222934]'
                      : 'text-[rgba(13,45,94,0.56)]'
                  }`}
                >
                  Из оффера
                  {alternativeSource === 'offer' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222934]" />
                  )}
                </button>
                <button
                  onClick={() => setAlternativeSource('catalog')}
                  className={`flex-1 px-4 py-3 text-[14px] font-medium relative ${
                    alternativeSource === 'catalog'
                      ? 'text-[#222934]'
                      : 'text-[rgba(13,45,94,0.56)]'
                  }`}
                >
                  Из каталога
                  {alternativeSource === 'catalog' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222934]" />
                  )}
                </button>
                <button
                  onClick={() => setAlternativeSource('new')}
                  className={`flex-1 px-4 py-3 text-[14px] font-medium relative ${
                    alternativeSource === 'new'
                      ? 'text-[#222934]'
                      : 'text-[rgba(13,45,94,0.56)]'
                  }`}
                >
                  Новый
                  {alternativeSource === 'new' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222934]" />
                  )}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">{relatedItemEditor && selectedRelatedItem ? (
              <div className="space-y-4">
                <div className="flex gap-3 rounded-xl bg-[rgba(13,45,94,0.04)] p-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[rgba(13,45,94,0.08)] bg-white">
                    {selectedRelatedItem.image ? (
                      <img src={selectedRelatedItem.image} alt={selectedRelatedItem.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[rgba(13,45,94,0.28)]">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                      {relatedItemEditor.kind === 'alternative' ? 'Альтернатива к товару' : 'Доп к товару'}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[15px] font-bold leading-5 text-[#222934]">
                      {selectedRelatedItem.name}
                    </div>
                    <div className="mt-2 text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                      {(selectedRelatedItem.price * selectedRelatedItem.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">SKU</span>
                    <input
                      value={relatedItemDraft.sku}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, sku: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      className="h-10 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[14px] font-medium text-[#222934] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Кол-во</span>
                    <input
                      inputMode="decimal"
                      value={relatedItemDraft.quantity}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, quantity: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      className="h-10 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[14px] font-medium text-[#222934] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Название</span>
                  <input
                    value={relatedItemDraft.name}
                    onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, name: event.target.value }))}
                    onBlur={() => saveRelatedItemEdit(false)}
                    className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Цена</span>
                    <input
                      inputMode="decimal"
                      value={relatedItemDraft.price}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, price: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      className="h-10 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[14px] font-medium text-[#222934] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Скидка, %</span>
                    <input
                      inputMode="decimal"
                      value={relatedItemDraft.discount}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, discount: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      placeholder="0"
                      className="h-10 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[14px] font-medium text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Комментарий для клиента</span>
                  <textarea
                    value={relatedItemDraft.comment}
                    onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, comment: event.target.value }))}
                    onBlur={() => saveRelatedItemEdit(false)}
                    placeholder="Комментарий к позиции"
                    className="min-h-24 w-full resize-none rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 py-2 text-[14px] leading-5 text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                  />
                </label>

                {relatedItemEditor.kind === 'alternative' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrimaryProduct(selectedProduct.groupId, selectedProductModel.id, relatedItemEditor.itemId);
                      setRelatedItemDraft(prev => ({ ...prev, isPrimary: !prev.isPrimary }));
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                      relatedItemDraft.isPrimary
                        ? 'border-[#FFC107] bg-[#FFF9E6]'
                        : 'border-[rgba(13,45,94,0.08)] bg-white hover:bg-[rgba(13,45,94,0.03)]'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-bold text-[#222934]">Основная альтернатива</div>
                      <div className="mt-0.5 text-[12px] text-[rgba(13,45,94,0.56)]">
                        Подставляется вместо базового товара в расчете
                      </div>
                    </div>
                    <Star className={`h-5 w-5 ${relatedItemDraft.isPrimary ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[rgba(13,45,94,0.28)]'}`} />
                  </button>
                )}

                <div className="rounded-xl bg-[rgba(13,45,94,0.04)] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold text-[#222934]">Копилка</div>
                      <div className="text-[12px] text-[rgba(13,45,94,0.56)]">Корректировка этой позиции</div>
                    </div>
                    <div className="rounded-full bg-[#FFF3E0] px-2 py-1 text-[12px] font-medium text-[#EF6C00]">
                      + остаток
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 py-2">
                      <span className="block text-[12px] text-[rgba(13,45,94,0.56)]">Списать</span>
                      <input
                        inputMode="decimal"
                        value={selectedPiggyAdjustment.writeOff}
                        onChange={(event) => updatePiggyAdjustment(relatedItemEditor.itemId, 'writeOff', event.target.value)}
                        placeholder="0 ₽"
                        className="mt-1 w-full bg-transparent text-[15px] font-medium text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)]"
                      />
                    </label>
                    <label className="block rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 py-2">
                      <span className="block text-[12px] text-[rgba(13,45,94,0.56)]">Накинуть</span>
                      <input
                        inputMode="decimal"
                        value={selectedPiggyAdjustment.markup}
                        onChange={(event) => updatePiggyAdjustment(relatedItemEditor.itemId, 'markup', event.target.value)}
                        placeholder="0 ₽"
                        className="mt-1 w-full bg-transparent text-[15px] font-medium text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)]"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={returnRelatedItemToGroup}
                  className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-4 text-[14px] font-semibold text-[#222934] hover:bg-[rgba(13,45,94,0.03)]"
                >
                  Вернуть в группу отдельным товаром
                </button>
              </div>
            ) : isMoveToGroupMode ? (
              <div className="space-y-2">
                {groups.filter(g => g.id !== selectedProduct.groupId).map(group => (
                  <button
                    key={group.id}
                    onClick={() => moveProductToGroup(selectedProductModel.id, selectedProduct.groupId, group.id)}
                    className="w-full p-3 border border-[rgba(13,45,94,0.08)] rounded-lg hover:bg-[rgba(13,45,94,0.04)] transition-colors text-left"
                  >
                    <div className="text-[16px] font-medium text-[#222934]">{group.name}</div>
                    <div className="text-[12px] text-[rgba(13,45,94,0.56)] mt-1">{group.products.length} позиций</div>
                  </button>
                ))}
              </div>
            ) : isAddAlternativeMode ? (
              <>
                {alternativeSource === 'offer' && (
                  <div className="space-y-2">
                    {getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-[16px] text-[rgba(13,45,94,0.56)] mb-2">Нет доступных товаров</div>
                        <div className="text-[14px] text-[rgba(13,45,94,0.56)]">Все товары уже добавлены как альтернативы</div>
                      </div>
                    ) : (
                      getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).map(({ product, groupId, groupName }) => (
                        <button
                          key={product.id}
                          onClick={() => addAlternativeManually(selectedProductModel.id, selectedProduct.groupId, product.id, groupId)}
                          className="w-full p-3 border border-[rgba(13,45,94,0.08)] rounded-lg hover:bg-[rgba(13,45,94,0.04)] transition-colors text-left"
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[rgba(13,45,94,0.04)] flex-shrink-0 border border-[rgba(13,45,94,0.08)]">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-4 h-4 text-[rgba(13,45,94,0.28)]">📦</div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-[rgba(13,45,94,0.56)] mb-1">{groupName}</div>
                              <div className="text-[14px] font-medium text-[#222934] truncate">{product.name}</div>
                              <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{product.sku}</div>
                            </div>
                            <div className="flex-shrink-0 text-[14px] font-medium text-[#222934]">
                              {(product.price * product.quantity).toLocaleString('ru-RU')} ₽
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {alternativeSource === 'catalog' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                      <input
                        type="text"
                        placeholder="Поиск в каталоге..."
                        className="w-full pl-10 pr-4 py-2 border border-[rgba(13,45,94,0.16)] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:ring-opacity-20"
                      />
                    </div>
                    <div className="text-center py-8">
                      <div className="text-[16px] text-[rgba(13,45,94,0.56)] mb-2">Каталог товаров</div>
                      <div className="text-[14px] text-[rgba(13,45,94,0.56)]">Здесь будет поиск по каталогу</div>
                    </div>
                  </div>
                )}

                {alternativeSource === 'new' && (
                  <div className="space-y-3">
                    <div className="text-center py-8">
                      <div className="text-[16px] text-[rgba(13,45,94,0.56)] mb-4">Создать новую альтернативу</div>
                      <button
                        onClick={() => createNewAlternative(selectedProductModel.id, selectedProduct.groupId)}
                        className="px-6 py-3 bg-[#007FFF] text-white rounded-lg font-medium hover:bg-[#0066CC] transition-colors"
                      >
                        Создать новый товар
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : isAddAddonMode ? (
              <div className="space-y-3">
                <button
                  onClick={() => createNewAddon(selectedProductModel.id, selectedProduct.groupId)}
                  className="flex w-full items-center justify-center rounded-lg bg-[#007FFF] px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0066CC]"
                >
                  + Создать новый доп
                </button>

                <div className="space-y-2">
                  {getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-[16px] text-[rgba(13,45,94,0.56)] mb-2">Нет доступных товаров</div>
                      <div className="text-[14px] text-[rgba(13,45,94,0.56)]">Все доступные товары уже связаны с этим товаром</div>
                    </div>
                  ) : (
                    getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).map(({ product, groupName }) => (
                      <button
                        key={product.id}
                        onClick={() => addAddonManually(selectedProductModel.id, product.id)}
                        className="w-full p-3 border border-[rgba(13,45,94,0.08)] rounded-lg hover:bg-[rgba(13,45,94,0.04)] transition-colors text-left"
                      >
                        <div className="flex gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[rgba(13,45,94,0.04)] flex-shrink-0 border border-[rgba(13,45,94,0.08)]">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-4 h-4 text-[rgba(13,45,94,0.28)]">📦</div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-[rgba(13,45,94,0.56)] mb-1">{groupName}</div>
                            <div className="text-[14px] font-medium text-[#222934] truncate">{product.name}</div>
                            <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{product.sku}</div>
                          </div>
                          <div className="flex-shrink-0 text-[14px] font-medium text-[#222934]">
                            {(product.price * product.quantity).toLocaleString('ru-RU')} ₽
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : productSubscreen === 'comment' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { clientCommentEnabled: !selectedProductClientCommentEnabled })}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                    selectedProductClientCommentEnabled
                      ? 'border-[#007FFF] bg-[#EEF6FF]'
                      : 'border-[rgba(13,45,94,0.08)] bg-white'
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-bold text-[#222934]">Показывать клиенту</div>
                    <div className="mt-0.5 text-[12px] text-[rgba(13,45,94,0.56)]">Комментарий будет виден в предложении</div>
                  </div>
                  <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${selectedProductClientCommentEnabled ? 'bg-[#007FFF]' : 'bg-[rgba(13,45,94,0.16)]'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${selectedProductClientCommentEnabled ? 'translate-x-5' : ''}`} />
                  </span>
                </button>

                {selectedProductClientCommentEnabled && (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Комментарий для клиента</span>
                    <textarea
                      defaultValue={selectedProductModel.comment || ''}
                      onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { comment: event.target.value, clientCommentEnabled: true })}
                      placeholder="Что важно пояснить клиенту"
                      className="min-h-28 w-full resize-none rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 py-2 text-[14px] leading-5 text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                    />
                  </label>
                )}
              </div>
            ) : productSubscreen === 'content' ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Анонс</span>
                  <textarea
                    value={productContentDraft.shortDescription}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, shortDescription: event.target.value }))}
                    onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { shortDescription: event.target.value })}
                    placeholder="Короткое описание в пару строк"
                    className="min-h-20 w-full resize-none rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 py-2 text-[14px] leading-5 text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Полное описание</span>
                  <textarea
                    value={productContentDraft.fullDescription}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, fullDescription: event.target.value }))}
                    placeholder="Длинное описание товара"
                    className="min-h-56 w-full resize-y rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 py-2 text-[14px] leading-5 text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                  />
                  <span className="mt-1.5 block text-[12px] text-[rgba(13,45,94,0.48)]">
                    {productContentDraft.fullDescription.length.toLocaleString('ru-RU')} символов
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[rgba(13,45,94,0.56)]">Ссылка</span>
                  <input
                    value={productContentDraft.link}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, link: event.target.value }))}
                    onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { link: event.target.value })}
                    placeholder="https://"
                    className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)] focus:ring-2 focus:ring-[#007FFF]/20"
                  />
                </label>
              </div>
            ) : productSubscreen === 'alternatives' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-medium text-[rgba(13,45,94,0.56)]">
                    {selectedProductModel.alternatives?.length ?? 0} позиций
                  </div>
                  <button
                    onClick={() => setIsAddAlternativeMode(true)}
                    className="flex h-9 items-center justify-center rounded-lg bg-[#EEF6FF] px-3 text-[14px] font-semibold text-[#007FFF]"
                  >
                    + Добавить
                  </button>
                </div>
                {(selectedProductModel.alternatives?.length ?? 0) > 0 ? (
                  selectedProductModel.alternatives?.map(alt => (
                    <div
                      key={alt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openRelatedItemEditor('alternative', alt)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') openRelatedItemEditor('alternative', alt);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 transition-colors hover:bg-[rgba(13,45,94,0.03)]"
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPrimaryProduct(selectedProduct.groupId, selectedProductModel.id, alt.id);
                        }}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(13,45,94,0.04)]"
                        aria-label={`Сделать основной альтернативу ${alt.name}`}
                      >
                        <Star className={`h-4 w-4 ${alt.isPrimary ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[rgba(13,45,94,0.28)]'}`} />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#222934]">{alt.name}</span>
                      <span className="flex-shrink-0 text-[14px] font-bold text-[#222934]">{(alt.price * alt.quantity).toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-[rgba(13,45,94,0.04)] px-3 py-4 text-center text-[14px] text-[rgba(13,45,94,0.56)]">Альтернативы пока не добавлены</div>
                )}
              </div>
            ) : productSubscreen === 'addons' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-medium text-[rgba(13,45,94,0.56)]">
                    {selectedProductModel.addons?.length ?? 0} позиций
                  </div>
                  <button
                    onClick={() => setIsAddAddonMode(true)}
                    className="flex h-9 items-center justify-center rounded-lg bg-[#FFF7E6] px-3 text-[14px] font-semibold text-[#B7791F]"
                  >
                    + Добавить
                  </button>
                </div>
                {(selectedProductModel.addons?.length ?? 0) > 0 ? (
                  selectedProductModel.addons?.map(addon => (
                    <div
                      key={addon.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openRelatedItemEditor('addon', addon)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') openRelatedItemEditor('addon', addon);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 transition-colors hover:bg-[rgba(13,45,94,0.03)]"
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#222934]">{addon.name}</span>
                      <span className="text-[13px] font-medium text-[rgba(13,45,94,0.56)]">{addon.quantity} шт.</span>
                      <span className="flex-shrink-0 text-[14px] font-bold text-[#222934]">{(addon.price * addon.quantity).toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-[rgba(13,45,94,0.04)] px-3 py-4 text-center text-[14px] text-[rgba(13,45,94,0.56)]">Допы пока не добавлены</div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[56px_minmax(0,1fr)_40px] items-start gap-3">
                  <button
                    type="button"
                    className="relative h-14 w-14 overflow-hidden rounded-lg border border-[rgba(13,45,94,0.10)] bg-[rgba(13,45,94,0.04)]"
                    aria-label="Изображения товара"
                  >
                    {selectedProductModel.image ? (
                      <img src={selectedProductModel.image} alt={selectedProductModel.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[rgba(13,45,94,0.28)]">📦</div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-[rgba(13,45,94,0.64)]">1</span>
                  </button>
                  <div className="min-w-0 space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Название</span>
                      <input
                        defaultValue={selectedProductModel.name}
                        onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { name: event.target.value.trim() || selectedProductModel.name })}
                        className="h-10 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[15px] font-bold text-[#222934] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                      />
                    </label>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                      <label className="block min-w-0">
                        <span className="mb-1 block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Артикул</span>
                        <input
                          defaultValue={selectedProductModel.sku}
                          onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { sku: event.target.value.trim() || selectedProductModel.sku })}
                          className="h-9 w-full rounded-lg border border-[rgba(13,45,94,0.14)] bg-white px-3 text-[13px] font-medium text-[rgba(13,45,94,0.72)] outline-none focus:ring-2 focus:ring-[#007FFF]/20"
                        />
                      </label>
                      <span className={`mb-1 rounded px-2 py-1 text-[11px] font-bold ${
                        selectedProductModel.source === 'catalog'
                          ? 'bg-[#E3F2FD] text-[#1976D2]'
                          : 'bg-[rgba(13,45,94,0.08)] text-[rgba(13,45,94,0.56)]'
                      }`}>
                        {selectedProductModel.source === 'catalog' ? 'Каталог' : 'Локальный'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProductActionsOpen(prev => !prev)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      isProductActionsOpen ? 'bg-[rgba(13,45,94,0.08)]' : 'hover:bg-[rgba(13,45,94,0.04)]'
                    }`}
                    aria-label="Действия с товаром"
                  >
                    <MoreVertical className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                  </button>
                </div>

                {isProductActionsOpen && (
                  <div className="rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-1.5 shadow-[0_8px_24px_rgba(13,45,94,0.08)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductActionsOpen(false);
                        setIsMoveToGroupMode(true);
                      }}
                      className="flex h-10 w-full items-center rounded-lg px-3 text-left text-[14px] font-medium text-[#222934] hover:bg-[rgba(13,45,94,0.04)]"
                    >
                      Переместить в группу
                    </button>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-[rgba(13,45,94,0.08)] bg-white">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="text-[13px] font-bold text-[rgba(13,45,94,0.56)]">Расчет</div>
                    <div className="text-right text-[18px] font-bold text-[#222934]">
                      {selectedProductTotal.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[rgba(13,45,94,0.08)] border-t border-[rgba(13,45,94,0.08)]">
                    <label className="block px-3 py-2">
                      <span className="block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Кол-во</span>
                      <input
                        inputMode="decimal"
                        defaultValue={selectedProductModel.quantity}
                        onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { quantity: parseDecimalInput(event.target.value, selectedProductModel.quantity) })}
                        className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <label className="block px-3 py-2">
                      <span className="block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Цена</span>
                      <input
                        inputMode="decimal"
                        defaultValue={selectedProductModel.price}
                        onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { price: parseDecimalInput(event.target.value, selectedProductModel.price) })}
                        className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <label className="block px-3 py-2">
                      <span className="block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Скидка</span>
                      <input
                        inputMode="decimal"
                        defaultValue={selectedProductModel.discount ?? ''}
                        onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { discount: event.target.value.trim() ? parseDecimalInput(event.target.value, selectedProductDiscount) : undefined })}
                        placeholder="0"
                        className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)]"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[rgba(13,45,94,0.08)] border-t border-[rgba(13,45,94,0.08)]">
                    <div className="px-3 py-2">
                      <span className="block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Цена со скидкой</span>
                      <span className="mt-1 block text-[15px] font-bold text-[#222934]">{selectedProductUnitPriceWithDiscount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="px-3 py-2">
                      <span className="block text-[11px] font-medium text-[rgba(13,45,94,0.56)]">Итого</span>
                      <span className="mt-1 block text-[16px] font-bold text-[#222934]">{selectedProductTotal.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>

                  <div className="border-t border-[rgba(13,45,94,0.08)] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProductPiggyEnabled) {
                          updateProductFields(selectedProduct.groupId, selectedProductModel.id, { piggyEnabled: false });
                          setPiggyAdjustments(prev => {
                            const next = { ...prev };
                            delete next[selectedProductModel.id];
                            return next;
                          });
                          return;
                        }
                        updateProductFields(selectedProduct.groupId, selectedProductModel.id, { piggyEnabled: true });
                      }}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[14px] font-bold text-[#222934]">Копилка</div>
                          <span className="rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[11px] font-semibold text-[#EF6C00]">
                            Остаток {piggyAvailableAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-[rgba(13,45,94,0.56)]">
                          {selectedProductPiggyEnabled
                            ? `В этой позиции ${selectedPiggyPositionAmount.toLocaleString('ru-RU')} ₽`
                            : 'Не используется в этой позиции'}
                        </div>
                      </div>
                      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${selectedProductPiggyEnabled ? 'bg-[#FF9800]' : 'bg-[rgba(13,45,94,0.16)]'}`}>
                        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${selectedProductPiggyEnabled ? 'translate-x-5' : ''}`} />
                      </span>
                    </button>

                    {selectedProductPiggyEnabled && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="block rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 py-2">
                          <span className="block text-[12px] text-[rgba(13,45,94,0.56)]">Списать</span>
                          <input
                            inputMode="decimal"
                            value={selectedPiggyAdjustment.writeOff}
                            onChange={(event) => updatePiggyAdjustment(selectedProductModel.id, 'writeOff', event.target.value)}
                            placeholder="0 ₽"
                            className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)]"
                          />
                        </label>
                        <label className="block rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 py-2">
                          <span className="block text-[12px] text-[rgba(13,45,94,0.56)]">Накинуть</span>
                          <input
                            inputMode="decimal"
                            value={selectedPiggyAdjustment.markup}
                            onChange={(event) => updatePiggyAdjustment(selectedProductModel.id, 'markup', event.target.value)}
                            placeholder="0 ₽"
                            className="mt-1 w-full bg-transparent text-[15px] font-bold text-[#222934] outline-none placeholder:text-[rgba(13,45,94,0.32)]"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(13,45,94,0.08)] bg-white">
                  <button
                    onClick={() => openProductContentScreen(selectedProductModel)}
                    className="flex w-full items-center justify-between gap-3 border-b border-[rgba(13,45,94,0.08)] px-3 py-3 text-left"
                  >
                    <div>
                      <div className="text-[14px] font-bold text-[#222934]">Контент товара</div>
                      <div className="mt-0.5 text-[12px] text-[rgba(13,45,94,0.56)]">
                        {selectedProductContentFilledCount}/3 заполнено
                      </div>
                    </div>
                    <ChevronDown className="-rotate-90 h-4 w-4 text-[rgba(13,45,94,0.4)]" />
                  </button>
                  <button
                    onClick={() => {
                      setIsProductActionsOpen(false);
                      setProductSubscreen('comment');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[#222934]">Комментарий клиенту</div>
                      <div className="mt-0.5 truncate text-[12px] text-[rgba(13,45,94,0.56)]">
                        {selectedProductClientCommentEnabled && selectedProductModel.comment ? selectedProductModel.comment : 'Не показывать'}
                      </div>
                    </div>
                    <ChevronDown className="-rotate-90 h-4 w-4 flex-shrink-0 text-[rgba(13,45,94,0.4)]" />
                  </button>
                </div>

                <div className="rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-[#222934]">Альтернативы</div>
                      <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{selectedProductModel.alternatives?.length ?? 0} позиций</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductActionsOpen(false);
                        setProductSubscreen(null);
                        setIsAddAlternativeMode(true);
                      }}
                      className="flex h-8 items-center rounded-lg bg-[#EEF6FF] px-3 text-[13px] font-semibold text-[#007FFF]"
                    >
                      + Добавить
                    </button>
                  </div>
                  {(selectedProductModel.alternatives?.length ?? 0) > 0 ? (
                    <div className="space-y-1.5">
                      {selectedProductModel.alternatives?.map(alt => (
                        <div
                          key={alt.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openRelatedItemEditor('alternative', alt)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') openRelatedItemEditor('alternative', alt);
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[rgba(13,45,94,0.04)] px-2 py-2"
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPrimaryProduct(selectedProduct.groupId, selectedProductModel.id, alt.id);
                            }}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white"
                            aria-label={`Сделать основной альтернативу ${alt.name}`}
                          >
                            <Star className={`h-4 w-4 ${alt.isPrimary ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[rgba(13,45,94,0.28)]'}`} />
                          </button>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#222934]">{alt.name}</span>
                          <span className="flex-shrink-0 text-[13px] font-bold text-[#222934]">{(alt.price * alt.quantity).toLocaleString('ru-RU')} ₽</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[rgba(13,45,94,0.04)] px-3 py-3 text-[13px] text-[rgba(13,45,94,0.56)]">Пока нет альтернатив</div>
                  )}
                </div>

                <div className="rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-[#222934]">Допы</div>
                      <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{selectedProductModel.addons?.length ?? 0} позиций</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductActionsOpen(false);
                        setProductSubscreen(null);
                        setIsAddAddonMode(true);
                      }}
                      className="flex h-8 items-center rounded-lg bg-[#FFF7E6] px-3 text-[13px] font-semibold text-[#B7791F]"
                    >
                      + Добавить
                    </button>
                  </div>
                  {(selectedProductModel.addons?.length ?? 0) > 0 ? (
                    <div className="space-y-1.5">
                      {selectedProductModel.addons?.map(addon => (
                        <div
                          key={addon.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openRelatedItemEditor('addon', addon)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') openRelatedItemEditor('addon', addon);
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[rgba(13,45,94,0.04)] px-2 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#222934]">{addon.name}</span>
                          <span className="text-[12px] font-medium text-[rgba(13,45,94,0.56)]">{addon.quantity} шт.</span>
                          <span className="flex-shrink-0 text-[13px] font-bold text-[#222934]">{(addon.price * addon.quantity).toLocaleString('ru-RU')} ₽</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[rgba(13,45,94,0.04)] px-3 py-3 text-[13px] text-[rgba(13,45,94,0.56)]">Пока нет допов</div>
                  )}
                </div>
              </div>
            )}
            </div>
            {productSubscreen === 'content' && !isAddAlternativeMode && !isAddAddonMode && !relatedItemEditor && (
              <div className="border-t border-[rgba(13,45,94,0.08)] p-4">
                <button
                  onClick={saveProductFullDescription}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-[#007FFF] px-4 text-[15px] font-semibold text-white hover:bg-[#0066CC]"
                >
                  Сохранить описание
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </DndProvider>
  );
}
