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
  Edit2,
  User,
  UserRound,
  Truck,
  CreditCard,
  Package,
  Link2,
  ChartNoAxesColumn
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
  clientCommentEnabled?: boolean;
  shortDescription?: string;
  fullDescription?: string;
  link?: string;
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
  clientCommentEnabled?: boolean;
  shortDescription?: string;
  fullDescription?: string;
  link?: string;
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

type RelatedDragItem = {
  itemId: string;
  parentProductId: string;
  kind: RelatedItemKind;
  index: number;
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
  clientCommentEnabled: boolean;
  shortDescription: string;
  fullDescription: string;
  link: string;
  isPrimary: boolean;
};

type ProductSubscreen = 'comment' | 'content' | 'alternatives' | 'addons' | null;
type RelatedSectionEditMode = RelatedItemKind | null;

type ProductContentDraft = {
  shortDescription: string;
  fullDescription: string;
  link: string;
};

type PiggyAdjustment = {
  writeOff: string;
  markup: string;
};

type ClientRecord = {
  id: string;
  name: string;
  company: string;
  phone: string;
};

type OfferIssueEntityKind = 'products' | 'deliveries' | 'payments' | 'managers';

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
  clientCommentEnabled: false,
  shortDescription: '',
  fullDescription: '',
  link: '',
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

function autoResizeTextarea(textarea: HTMLTextAreaElement, maxRows = 3) {
  textarea.style.height = 'auto';
  const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight || '24');
  const maxHeight = lineHeight * maxRows;
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function pluralize(n: number, forms: [string, string, string]) {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const positionsForm = (n: number) => pluralize(n, ['позиция', 'позиции', 'позиций']);
const alternativesForm = (n: number) => pluralize(n, ['альтернатива', 'альтернативы', 'альтернатив']);
const addonsForm = (n: number) => pluralize(n, ['доп', 'допа', 'допов']);

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
  onDelete: (groupId: string) => void;
}

function DraggableGroup({ group, index, isSelected, moveGroup, onSelectGroup, onDelete }: DraggableGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    <div className="relative overflow-hidden border-b border-[rgba(13,45,94,0.08)]">
      {/* Swipe delete background */}
      <div 
        className="absolute inset-0 flex items-center justify-end bg-[#FF4D4F] px-4"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Удалить группу "${group.name}"?`)) {
            onDelete(group.id);
          }
        }}
      >
        <span className="text-[15px] font-semibold text-white">Удалить</span>
      </div>
      
      {/* Main group content */}
      <div
        ref={contentRef}
        className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all bg-white ${
          isDragging ? 'opacity-50' : ''
        } ${
          isOver
            ? 'bg-[rgba(0,127,255,0.08)] border-[#007FFF]'
            : isSelected
              ? 'bg-[#EEF6FF]'
              : 'hover:bg-[rgba(13,45,94,0.04)]'
        }`}
        style={{
          touchAction: 'pan-y',
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const target = contentRef.current;
          if (!target) return;
          
          const startX = touch.clientX;
          const startTime = Date.now();
          
          const handleMove = (moveEvent: TouchEvent) => {
            const moveTouch = moveEvent.touches[0];
            const deltaX = moveTouch.clientX - startX;
            
            if (deltaX < 0) {
              const clampedDelta = Math.max(deltaX, -80);
              target.style.transform = `translateX(${clampedDelta}px)`;
            }
          };
          
          const handleEnd = (endEvent: TouchEvent) => {
            const endTouch = endEvent.changedTouches[0];
            const deltaX = endTouch.clientX - startX;
            const deltaTime = Date.now() - startTime;
            const velocity = Math.abs(deltaX) / deltaTime;
            
            if (deltaX < -60 || velocity > 0.5) {
              target.style.transform = 'translateX(-80px)';
            } else {
              target.style.transform = 'translateX(0)';
            }
            
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
          };
          
          document.addEventListener('touchmove', handleMove);
          document.addEventListener('touchend', handleEnd);
        }}
        onClick={(e) => {
          const target = contentRef.current;
          if (!target) return;
          
          const transform = target.style.transform;
          
          if (transform && transform.includes('-80px')) {
            target.style.transform = 'translateX(0)';
          } else {
            onSelectGroup(group.id);
          }
        }}
      >
        <div ref={ref} className="flex-1 min-w-0">
          <div className="text-[16px] font-medium text-[#222934] truncate">{group.name}</div>
          <div className="text-[12px] text-[rgba(13,45,94,0.56)]">{group.products.length} {positionsForm(group.products.length)}</div>
        </div>
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
      className={`${className} ${
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

interface DraggableRelatedItemProps {
  itemId: string;
  parentProductId: string;
  kind: RelatedItemKind;
  index: number;
  onReorder: (kind: RelatedItemKind, parentProductId: string, draggedItemId: string, targetItemId: string, position: 'before' | 'after') => void;
  onClick: () => void;
  children: React.ReactNode;
}

function DraggableRelatedItem({
  itemId,
  parentProductId,
  kind,
  index,
  onReorder,
  onClick,
  children
}: DraggableRelatedItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: `related-${kind}`,
    item: { itemId, parentProductId, kind, index } satisfies RelatedDragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: `related-${kind}`,
    hover: (item: RelatedDragItem, monitor) => {
      if (item.itemId === itemId || item.parentProductId !== parentProductId || !ref.current) {
        setDropPosition(null);
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        setDropPosition(null);
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - rect.top;
      setDropPosition(hoverClientY < rect.height / 2 ? 'before' : 'after');
    },
    drop: (item: RelatedDragItem, monitor) => {
      if (item.itemId === itemId || item.parentProductId !== parentProductId || !ref.current) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const rect = ref.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - rect.top;
      const position = hoverClientY < rect.height / 2 ? 'before' : 'after';
      onReorder(kind, parentProductId, item.itemId, itemId, position);
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (!isOver) {
      setDropPosition(null);
    }
  }, [isOver]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`relative cursor-grab transition-all active:cursor-grabbing ${isDragging ? 'opacity-35' : ''}`}
    >
      {dropPosition === 'before' && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 -mt-0.5 rounded-full bg-[#007FFF]" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 -mb-0.5 rounded-full bg-[#007FFF]" />
      )}
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
  const [clients, setClients] = useState<ClientRecord[]>([
    { id: 'client-1', name: 'Анна Соколова', company: 'АвтоТех Сервис', phone: '+7 900 123-45-67' },
    { id: 'client-2', name: 'Иван Петров', company: 'Шина Плюс', phone: '+7 921 555-44-33' },
    { id: 'client-3', name: 'Мария Орлова', company: 'Garage Pro', phone: '+7 911 888-12-12' }
  ]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientDraft, setClientDraft] = useState({ name: '', company: '', phone: '', email: '' });
  const [editingOfferTitle, setEditingOfferTitle] = useState('');
  const [editingOfferDescription, setEditingOfferDescription] = useState('');
  const [groupContextMenuId, setGroupContextMenuId] = useState<string | null>(null);
  const [isGroupEditDrawerOpen, setIsGroupEditDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; groupId: string } | null>(null);
  const [isAddAlternativeMode, setIsAddAlternativeMode] = useState(false);
  const [isAddAddonMode, setIsAddAddonMode] = useState(false);
  const [relatedItemEditor, setRelatedItemEditor] = useState<RelatedItemEditor | null>(null);
  const [relatedItemActionsOpen, setRelatedItemActionsOpen] = useState(false);
  const [relatedItemSubscreen, setRelatedItemSubscreen] = useState<'content' | null>(null);
  const [relatedItemDraft, setRelatedItemDraft] = useState<RelatedItemDraft>(emptyRelatedItemDraft);
  const [relatedSectionEditMode, setRelatedSectionEditMode] = useState<RelatedSectionEditMode>(null);
  const [productSubscreen, setProductSubscreen] = useState<ProductSubscreen>(null);
  const [productContentDraft, setProductContentDraft] = useState<ProductContentDraft>(emptyProductContentDraft);
  const [, setIsProductActionsOpen] = useState(false);
  const [alternativeSource, setAlternativeSource] = useState<'offer' | 'catalog'>('offer');
  const [selectedAlternativeIds, setSelectedAlternativeIds] = useState<string[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
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

  const adjustProductQuantity = (groupId: string, productId: string, delta: number) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              products: group.products.map(product =>
                product.id === productId
                  ? { ...product, quantity: Math.max(1, product.quantity + delta) }
                  : product
              )
            }
          : group
      )
    );
  };

  const adjustSelectedProductDiscount = (delta: number) => {
    if (!selectedProduct || !selectedProductModel) return;
    const current = selectedProductModel.discount ?? 0;
    const next = Math.max(0, Math.min(100, Math.round((current + delta) * 100) / 100));
    updateProductFields(selectedProduct.groupId, selectedProductModel.id, {
      discount: next > 0 ? next : undefined
    });
  };

  const adjustRelatedDraftQuantity = (delta: number) => {
    const current = parseDecimalInput(relatedItemDraft.quantity, 1);
    const next = Math.max(1, current + delta);
    const nextDraft = { ...relatedItemDraft, quantity: String(next) };
    setRelatedItemDraft(nextDraft);
    saveRelatedItemEdit(false, nextDraft);
  };

  const adjustRelatedDraftDiscount = (delta: number) => {
    const current = parseDecimalInput(relatedItemDraft.discount, 0);
    const next = Math.max(0, Math.min(100, Math.round((current + delta) * 100) / 100));
    const nextDraft = { ...relatedItemDraft, discount: next > 0 ? String(next) : '' };
    setRelatedItemDraft(nextDraft);
    saveRelatedItemEdit(false, nextDraft);
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
    clientCommentEnabled: product.clientCommentEnabled,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    link: product.link,
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
    clientCommentEnabled: product.clientCommentEnabled,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    link: product.link,
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
    clientCommentEnabled: alternative.clientCommentEnabled,
    shortDescription: alternative.shortDescription,
    fullDescription: alternative.fullDescription,
    link: alternative.link,
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
    clientCommentEnabled: addon.clientCommentEnabled,
    shortDescription: addon.shortDescription,
    fullDescription: addon.fullDescription,
    link: addon.link,
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

  const openRelatedItemEditor = (kind: RelatedItemKind, item: Alternative | Addon) => {
    setRelatedItemEditor({ kind, itemId: item.id });
    setRelatedItemActionsOpen(false);
    setRelatedItemDraft({
      sku: item.sku || '',
      name: item.name,
      quantity: String(item.quantity),
      price: String(item.price),
      discount: item.discount !== undefined ? String(item.discount) : '',
      comment: item.comment || '',
      clientCommentEnabled: Boolean(item.clientCommentEnabled ?? item.comment),
      shortDescription: item.shortDescription || '',
      fullDescription: item.fullDescription || '',
      link: item.link || '',
      isPrimary: kind === 'alternative' ? Boolean((item as Alternative).isPrimary) : false
    });
    setRelatedItemSubscreen(null);
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
    setRelatedItemActionsOpen(false);
    setProductSubscreen(null);
    setProductContentDraft(emptyProductContentDraft);
    setRelatedItemEditor(null);
    setRelatedItemSubscreen(null);
    setRelatedItemDraft(emptyRelatedItemDraft);
    setRelatedSectionEditMode(null);
    setAlternativeSource('offer');
  };

  const goBackInProductDrawer = () => {
    setIsProductActionsOpen(false);

    if (relatedItemEditor) {
      if (relatedItemSubscreen) {
        setRelatedItemSubscreen(null);
        return;
      }
      saveRelatedItemEdit(false);
      setRelatedItemActionsOpen(false);
      setRelatedItemEditor(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
      return;
    }

    if (isAddAlternativeMode) {
      setIsAddAlternativeMode(false);
      setAlternativeSource('offer');
      return;
    }

    if (isAddAddonMode) {
      setIsAddAddonMode(false);
      return;
    }

    if (isMoveToGroupMode) {
      setIsMoveToGroupMode(false);
      return;
    }

    if (productSubscreen) {
      setProductSubscreen(null);
      setProductContentDraft(emptyProductContentDraft);
      return;
    }
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
                      clientCommentEnabled: alternative.id === relatedItemEditor.itemId ? draft.clientCommentEnabled : alternative.clientCommentEnabled,
                      shortDescription: alternative.id === relatedItemEditor.itemId ? draft.shortDescription : alternative.shortDescription,
                      fullDescription: alternative.id === relatedItemEditor.itemId ? draft.fullDescription : alternative.fullDescription,
                      link: alternative.id === relatedItemEditor.itemId ? draft.link : alternative.link,
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
                          comment: draft.comment,
                          clientCommentEnabled: draft.clientCommentEnabled,
                          shortDescription: draft.shortDescription,
                          fullDescription: draft.fullDescription,
                          link: draft.link
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
      setRelatedItemSubscreen(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
    }
  };

  const returnRelatedItemToGroup = () => {
    if (!selectedProduct || !relatedItemEditor) return;
    setRelatedItemActionsOpen(false);

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

  const unlinkRelatedItem = (kind: RelatedItemKind, itemId: string) => {
    if (!selectedProduct) return;
    setRelatedItemActionsOpen(false);

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const group = newGroups.find(currentGroup => currentGroup.id === selectedProduct.groupId);
      const productIndex = group?.products.findIndex(product => product.id === selectedProduct.product.id) ?? -1;

      if (!group || productIndex === -1) return prevGroups;

      const parentProduct = group.products[productIndex];

      if (kind === 'alternative') {
        const alternativeIndex = parentProduct.alternatives?.findIndex(alternative => alternative.id === itemId) ?? -1;
        if (alternativeIndex === -1 || !parentProduct.alternatives) return prevGroups;

        const [removedAlternative] = parentProduct.alternatives.splice(alternativeIndex, 1);
        if (removedAlternative.isPrimary) {
          parentProduct.isPrimary = true;
        }

        normalizeAlternativeProduct(parentProduct);
        group.products.splice(productIndex + 1, 0, alternativeToProduct(removedAlternative));
        return newGroups;
      }

      const addonIndex = parentProduct.addons?.findIndex(addon => addon.id === itemId) ?? -1;
      if (addonIndex === -1 || !parentProduct.addons) return prevGroups;

      const [removedAddon] = parentProduct.addons.splice(addonIndex, 1);
      group.products.splice(productIndex + 1, 0, addonToProduct(removedAddon));
      return newGroups;
    });

    if (relatedItemEditor?.itemId === itemId && relatedItemEditor.kind === kind) {
      setRelatedItemEditor(null);
      setRelatedItemSubscreen(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
    }
  };

  const deleteRelatedItem = (kind: RelatedItemKind, itemId: string) => {
    if (!selectedProduct) return;
    setRelatedItemActionsOpen(false);

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const group = newGroups.find(currentGroup => currentGroup.id === selectedProduct.groupId);
      const productIndex = group?.products.findIndex(product => product.id === selectedProduct.product.id) ?? -1;

      if (!group || productIndex === -1) return prevGroups;

      const parentProduct = group.products[productIndex];

      if (kind === 'alternative') {
        const alternativeIndex = parentProduct.alternatives?.findIndex(alternative => alternative.id === itemId) ?? -1;
        if (alternativeIndex === -1 || !parentProduct.alternatives) return prevGroups;

        const [removedAlternative] = parentProduct.alternatives.splice(alternativeIndex, 1);
        if (removedAlternative.isPrimary) {
          parentProduct.isPrimary = true;
        }

        normalizeAlternativeProduct(parentProduct);
        return newGroups;
      }

      const addonIndex = parentProduct.addons?.findIndex(addon => addon.id === itemId) ?? -1;
      if (addonIndex === -1 || !parentProduct.addons) return prevGroups;

      parentProduct.addons.splice(addonIndex, 1);
      return newGroups;
    });

    if (relatedItemEditor?.itemId === itemId && relatedItemEditor.kind === kind) {
      setRelatedItemEditor(null);
      setRelatedItemSubscreen(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
      setProductSubscreen(kind === 'alternative' ? 'alternatives' : 'addons');
    }
  };

  const convertRelatedItemKind = (itemId: string, fromKind: RelatedItemKind, toKind: RelatedItemKind) => {
    if (!selectedProduct || fromKind === toKind) return;
    setRelatedItemActionsOpen(false);

    let nextItem: Alternative | Addon | null = null;

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const group = newGroups.find(currentGroup => currentGroup.id === selectedProduct.groupId);
      const productIndex = group?.products.findIndex(product => product.id === selectedProduct.product.id) ?? -1;

      if (!group || productIndex === -1) return prevGroups;

      const parentProduct = group.products[productIndex];

      if (fromKind === 'alternative') {
        const alternativeIndex = parentProduct.alternatives?.findIndex(alternative => alternative.id === itemId) ?? -1;
        if (alternativeIndex === -1 || !parentProduct.alternatives) return prevGroups;

        const [removedAlternative] = parentProduct.alternatives.splice(alternativeIndex, 1);
        if (removedAlternative.isPrimary) {
          parentProduct.isPrimary = true;
        }
        normalizeAlternativeProduct(parentProduct);

        parentProduct.addons = parentProduct.addons || [];
        if (parentProduct.addons.some(addon => addon.id === itemId)) return prevGroups;
        const addon = productToAddon(alternativeToProduct(removedAlternative));
        parentProduct.addons.push(addon);
        nextItem = addon;
        return newGroups;
      }

      const addonIndex = parentProduct.addons?.findIndex(addon => addon.id === itemId) ?? -1;
      if (addonIndex === -1 || !parentProduct.addons) return prevGroups;

      const [removedAddon] = parentProduct.addons.splice(addonIndex, 1);
      parentProduct.alternatives = parentProduct.alternatives || [];
      if (parentProduct.alternatives.some(alternative => alternative.id === itemId)) return prevGroups;

      const alternative = productToAlternative(addonToProduct(removedAddon));
      alternative.isPrimary = false;
      parentProduct.isPrimary = parentProduct.isPrimary ?? true;
      parentProduct.alternatives.push(alternative);
      normalizeAlternativeProduct(parentProduct);
      nextItem = alternative;
      return newGroups;
    });

    if (nextItem) {
      openRelatedItemEditor(toKind, nextItem);
    }
  };

  const addAlternativeManually = (targetProductId: string, _targetGroupId: string, sourceProductId: string, _sourceGroupId: string) => {
    addProductToAlternativeGroup(sourceProductId, targetProductId);
    setIsAddAlternativeMode(false);
    setAlternativeSource('offer');
    setProductSubscreen('alternatives');
  };

  const addAddonManually = (targetProductId: string, sourceProductId: string) => {
    addProductAsAddon(sourceProductId, targetProductId);
    setIsAddAddonMode(false);
    setProductSubscreen('addons');
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

    // Open editor for the newly created alternative
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

    // Open editor for the newly created addon
    setIsAddAddonMode(false);
    openRelatedItemEditor('addon', newAddon);
  };

  const reorderRelatedItems = (
    kind: RelatedItemKind,
    parentProductId: string,
    draggedItemId: string,
    targetItemId: string,
    position: 'before' | 'after'
  ) => {
    setGroups(prevGroups => {
      if (draggedItemId === targetItemId) return prevGroups;

      const newGroups = cloneGroups(prevGroups);
      const parentLocation = findProductLocation(newGroups, parentProductId);
      if (!parentLocation || parentLocation.sourceKind !== 'product') return prevGroups;

      const parentProduct = newGroups[parentLocation.groupIndex].products[parentLocation.productIndex];
      const items = kind === 'alternative' ? parentProduct.alternatives : parentProduct.addons;
      if (!items?.length) return prevGroups;

      const draggedIndex = items.findIndex(item => item.id === draggedItemId);
      const targetIndex = items.findIndex(item => item.id === targetItemId);
      if (draggedIndex === -1 || targetIndex === -1) return prevGroups;

      const [draggedItem] = items.splice(draggedIndex, 1);
      const adjustedTargetIndex = items.findIndex(item => item.id === targetItemId);
      const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;
      items.splice(insertIndex, 0, draggedItem);

      return newGroups;
    });
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

  const promoteRelatedItemToMain = (kind: RelatedItemKind, itemId: string) => {
    if (!selectedProduct || !selectedProductModel) return;

    const parentGroupId = selectedProduct.groupId;
    const parentProductId = selectedProductModel.id;
    let nextSelectedProduct: Product | null = null;

    setGroups(prevGroups => {
      const newGroups = cloneGroups(prevGroups);
      const group = newGroups.find(entry => entry.id === parentGroupId);
      if (!group) return prevGroups;

      const productIndex = group.products.findIndex(entry => entry.id === parentProductId);
      if (productIndex === -1) return prevGroups;

      const parentProduct = group.products[productIndex];

      if (kind === 'alternative') {
        const alternativeIndex = parentProduct.alternatives?.findIndex(item => item.id === itemId) ?? -1;
        if (alternativeIndex === -1 || !parentProduct.alternatives) return prevGroups;

        const [nextMainAlternative] = parentProduct.alternatives.splice(alternativeIndex, 1);
        const previousMainAlternative = productToAlternative(parentProduct);
        previousMainAlternative.isPrimary = false;

        const nextProduct: Product = {
          id: nextMainAlternative.id,
          sku: nextMainAlternative.sku,
          name: nextMainAlternative.name,
          quantity: nextMainAlternative.quantity,
          price: nextMainAlternative.price,
          image: nextMainAlternative.image,
          source: nextMainAlternative.source ?? 'catalog',
          comment: nextMainAlternative.comment,
          discount: nextMainAlternative.discount,
          hasUpdates: nextMainAlternative.hasUpdates,
          isPrimary: true,
          alternatives: [previousMainAlternative, ...parentProduct.alternatives.map(item => ({ ...item, isPrimary: false }))],
          addons: parentProduct.addons?.map(item => ({ ...item })) ?? []
        };

        group.products[productIndex] = nextProduct;
        nextSelectedProduct = nextProduct;
        return newGroups;
      }

      const addonIndex = parentProduct.addons?.findIndex(item => item.id === itemId) ?? -1;
      if (addonIndex === -1 || !parentProduct.addons) return prevGroups;

      const [nextMainAddon] = parentProduct.addons.splice(addonIndex, 1);
      const previousMainAddon = productToAddon(parentProduct);

      const nextProduct: Product = {
        id: nextMainAddon.id,
        sku: nextMainAddon.sku || 'ADDON',
        name: nextMainAddon.name,
        quantity: nextMainAddon.quantity,
        price: nextMainAddon.price,
        image: nextMainAddon.image,
        source: nextMainAddon.source ?? 'local',
        comment: nextMainAddon.comment,
        discount: nextMainAddon.discount,
        hasUpdates: nextMainAddon.hasUpdates,
        isPrimary: true,
        alternatives: parentProduct.alternatives?.map(item => ({ ...item, isPrimary: false })) ?? [],
        addons: [previousMainAddon, ...parentProduct.addons.map(item => ({ ...item }))]
      };

      group.products[productIndex] = nextProduct;
      nextSelectedProduct = nextProduct;
      return newGroups;
    });

    if (nextSelectedProduct) {
      setSelectedProduct({ product: nextSelectedProduct, groupId: parentGroupId });
      setRelatedItemActionsOpen(false);
      setRelatedItemEditor(null);
      setRelatedItemSubscreen(null);
      setRelatedItemDraft(emptyRelatedItemDraft);
    }
  };

  const deleteProduct = (productId: string, groupId: string) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              products: group.products.filter(product => product.id !== productId)
            }
          : group
      )
    );

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

  const deleteGroup = (groupId: string) => {
    const remainingGroups = groups.filter(group => group.id !== groupId);
    setGroups(remainingGroups);
    setGroupContextMenuId(null);

    if (selectedProduct?.groupId === groupId) {
      closeProductDrawer();
    }

    if (editingGroupId === groupId) {
      closeGroupEditDrawer();
    }

    if (currentGroupId === groupId) {
      setCurrentGroupId(remainingGroups[0]?.id ?? '');
    }

    if (pinnedGroupId === groupId) {
      setPinnedGroupId(null);
    }
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

  const updateProductDiscountedPrice = (groupId: string, product: Product, value: string) => {
    const nextDiscountedPrice = parseDecimalInput(value, product.price);
    if (product.price <= 0 || nextDiscountedPrice > product.price) {
      updateProductFields(groupId, product.id, {
        price: nextDiscountedPrice,
        discount: undefined
      });
      return;
    }

    const nextDiscount = ((product.price - nextDiscountedPrice) / product.price) * 100;
    updateProductFields(groupId, product.id, {
      discount: nextDiscount > 0 ? nextDiscount : undefined
    });
  };

  const updateRelatedDraftDiscountedPrice = (value: string) => {
    const basePrice = parseDecimalInput(relatedItemDraft.price, 0);
    const nextDiscountedPrice = parseDecimalInput(value, basePrice);

    if (basePrice <= 0 || nextDiscountedPrice > basePrice) {
      setRelatedItemDraft(prev => ({
        ...prev,
        price: String(nextDiscountedPrice),
        discount: ''
      }));
      return;
    }

    const nextDiscount = ((basePrice - nextDiscountedPrice) / basePrice) * 100;
    setRelatedItemDraft(prev => ({
      ...prev,
      discount: nextDiscount > 0 ? nextDiscount.toFixed(2) : ''
    }));
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

  const openRelatedItemContentScreen = () => {
    setRelatedItemSubscreen('content');
    setRelatedItemActionsOpen(false);
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

  const filteredClients = clients.filter(client => {
    const haystack = `${client.name} ${client.company} ${client.phone}`.toLowerCase();
    return haystack.includes(clientSearchQuery.trim().toLowerCase());
  });

  const openClientDrawer = () => {
    setClientSearchQuery('');
    setClientDraft({ name: '', company: '', phone: '' });
    setIsClientDrawerOpen(true);
  };

  const closeClientDrawer = () => {
    setIsClientDrawerOpen(false);
    setClientSearchQuery('');
    setClientDraft({ name: '', company: '', phone: '' });
  };

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    closeClientDrawer();
  };

  const createClientFromDraft = () => {
    if (!clientDraft.name.trim()) return;
    const newClient: ClientRecord = {
      id: `client-${Date.now()}`,
      name: clientDraft.name.trim(),
      company: clientDraft.company.trim(),
      phone: clientDraft.phone.trim()
    };
    setClients(prev => [newClient, ...prev]);
    setSelectedClientId(newClient.id);
    closeClientDrawer();
  };

  const openIssueEntity = (kind: OfferIssueEntityKind) => {
    setIsOfferIssuesOpen(false);
    if (kind === 'deliveries') {
      setIsDeliveryDrawerOpen(true);
      return;
    }
    if (kind === 'payments') {
      setIsPaymentDrawerOpen(true);
      return;
    }
    if (kind === 'managers') {
      setIsOfferMenuOpen(true);
    }
  };

  const offerStatus = offerStatusOptions.find(status => status.id === offerStatusId) ?? offerStatusOptions[0];
  const offerStatusStyle = offerStatusToneClasses[offerStatus.tone];
  const updatedProductsCount = 4;
  const updatedDeliveriesCount = 0;
  const updatedPaymentsCount = 3;
  const lostProductsCount = 1;
  const lostDeliveriesCount = 3;
  const lostPaymentsCount = 0;
  const deliveriesCount: number = 2;
  const paymentsCount: number = 1;
  const selectedClient = clients.find(client => client.id === selectedClientId) ?? null;
  const hasClient = Boolean(selectedClient);
  const hasUpdates = updatedProductsCount + updatedDeliveriesCount + updatedPaymentsCount > 0;
  const hasLostEntities = lostProductsCount + lostDeliveriesCount + lostPaymentsCount > 0;
  const hasResponsibleManager = false;
  const offerIssuesCount = (hasUpdates ? 1 : 0) + (hasLostEntities ? 1 : 0) + (!hasResponsibleManager ? 1 : 0);
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
    ? relatedItemSubscreen === 'content'
      ? 'Контент'
      : relatedItemEditor.kind === 'alternative'
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
  const selectedProductPiggyEnabled = Boolean(
    selectedProductModel?.piggyEnabled ||
    selectedPiggyAdjustment.writeOff ||
    selectedPiggyAdjustment.markup
  );
  const selectedProductClientCommentEnabled = Boolean(
    selectedProductModel?.clientCommentEnabled ?? selectedProductModel?.comment
  );
  const selectedProductAlternatives = selectedProductModel?.alternatives ?? [];
  const selectedProductAddons = selectedProductModel?.addons ?? [];
  const formatProductMoney = (value: number) => value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
        className="fixed top-0 left-0 right-0 z-40 bg-[#F6F7F9] transition-transform duration-300 ease-in-out"
        style={{
          transform: headerVisible ? 'translateY(0)' : `translateY(-${COLLAPSIBLE_HEADER_HEIGHT}px)`
        }}
      >
        {/* Header */}
        <header className="px-2 pb-1 pt-2">
          <div className="flex h-10 min-w-0 items-center gap-2">
            <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl hover:bg-[rgba(13,45,94,0.04)]">
              <ChevronLeft className="w-5 h-5 text-[#0D2D5E]" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex-shrink-0 text-[16px] font-bold text-[#222934]">995-100</span>
              <div className="relative min-w-0 flex-1">
                <button
                  onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  className={`flex h-10 max-w-full min-w-0 items-center gap-1 rounded-[8px] px-4 text-[14px] font-medium ${offerStatusStyle.pill}`}
                  aria-expanded={isStatusDropdownOpen}
                  aria-label={`Статус оффера: ${offerStatus.label}`}
                >
                  <span className="min-w-0 truncate">{offerStatus.label}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
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
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                  aria-label={`Проблемы оффера: ${offerIssuesCount}`}
                >
                  <TriangleAlert className={`h-5 w-5 ${offerIssuesTone === 'critical' ? 'text-[#EC3F39]' : 'text-[#F59E0B]'}`} />
                </button>
              )}
              <button
                onClick={() => {
                  setIsStatusDropdownOpen(false);
                  setIsOfferMenuOpen(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[rgba(13,45,94,0.04)]"
                aria-label="Меню"
              >
                <MoreVertical className="w-5 h-5 text-[#0D2D5E] opacity-56" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-[9px] pb-2 pt-1">
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={openClientDrawer}
              className={`flex h-10 flex-shrink-0 items-center gap-1 rounded-full px-5 text-[14px] font-medium transition-colors ${
                hasClient
                  ? 'bg-[rgba(13,45,94,0.08)] text-[#222934] hover:bg-[rgba(13,45,94,0.12)]'
                  : 'bg-[rgba(0,127,255,0.08)] text-[#007FFF] hover:bg-[rgba(0,127,255,0.12)]'
              }`}
            >
              {!hasClient && <span className="text-[#007FFF]">+</span>}
              <span>{selectedClient ? selectedClient.name : 'Клиент'}</span>
            </button>

            <button
              type="button"
              onClick={openOfferDescriptionDrawer}
              className={`flex h-10 flex-shrink-0 items-center gap-1 rounded-full px-5 text-[14px] font-medium transition-colors ${
                hasOfferDescription
                  ? 'bg-[rgba(13,45,94,0.08)] text-[#222934] hover:bg-[rgba(13,45,94,0.12)]'
                  : 'bg-[rgba(0,127,255,0.08)] text-[#007FFF] hover:bg-[rgba(0,127,255,0.12)]'
              }`}
            >
              {!hasOfferDescription && <span className="text-[#007FFF]">+</span>}
              <span>Описание</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeliveryDrawerOpen(true)}
              className={`flex h-10 flex-shrink-0 items-center gap-1 rounded-full px-5 text-[14px] font-medium transition-colors ${
                deliveriesCount > 0
                  ? 'bg-[rgba(13,45,94,0.08)] text-[#222934] hover:bg-[rgba(13,45,94,0.12)]'
                  : 'bg-[rgba(0,127,255,0.08)] text-[#007FFF] hover:bg-[rgba(0,127,255,0.12)]'
              }`}
            >
              {deliveriesCount === 0 && <span className="text-[#007FFF]">+</span>}
              <span>Доставки</span>
              {deliveriesCount > 0 && (
                <span className="flex h-[22px] min-w-[20px] items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                  {deliveriesCount}
                </span>
              )}
              {hasDeliveryProblems && <span className="h-2 w-2 rounded-full bg-[#EC3F39]" />}
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentDrawerOpen(true)}
              className={`flex h-10 flex-shrink-0 items-center gap-1 rounded-full px-5 text-[14px] font-medium transition-colors ${
                paymentsCount > 0
                  ? 'bg-[rgba(13,45,94,0.08)] text-[#222934] hover:bg-[rgba(13,45,94,0.12)]'
                  : 'bg-[rgba(0,127,255,0.08)] text-[#007FFF] hover:bg-[rgba(0,127,255,0.12)]'
              }`}
            >
              {paymentsCount === 0 && <span className="text-[#007FFF]">+</span>}
              <span>Оплаты</span>
              {paymentsCount > 0 && (
                <span className="flex h-[22px] min-w-[20px] items-center justify-center rounded-full bg-[rgba(13,45,94,0.08)] px-1.5 text-[12px] font-medium text-[rgba(13,45,94,0.56)]">
                  {paymentsCount}
                </span>
              )}
              {hasPaymentProblems && <span className="h-2 w-2 rounded-full bg-[#EC3F39]" />}
            </button>
          </div>
        </div>
      </div>

      {pinnedGroup && (
        <DroppableGroupHeader
          groupId={pinnedGroup.id}
          onProductDrop={moveProductToGroup}
          setDragTooltip={setDragTooltip}
          className="fixed left-0 right-0 z-50 shadow-[0_4px_14px_rgba(13,45,94,0.08)] transition-[top,background-color]"
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
                className="overflow-hidden rounded-2xl bg-white"
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
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setGroupContextMenuId(prev => prev === group.id ? null : group.id);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[rgba(13,45,94,0.04)]"
                          aria-label={`Меню группы ${group.name}`}
                        >
                          <MoreVertical className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                        </button>
                        {groupContextMenuId === group.id && (
                          <div
                            className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-[16px] border border-[rgba(13,45,94,0.08)] bg-white p-1 shadow-[0_12px_32px_rgba(13,45,94,0.14)]"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openGroupEditDrawer(group)}
                              className="flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] font-medium text-[#222934] hover:bg-[rgba(13,45,94,0.04)]"
                            >
                              <Edit2 className="h-4 w-4 text-[rgba(13,45,94,0.56)]" />
                              <span>Редактировать</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGroup(group.id)}
                              className="flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] font-medium text-[#EC3F39] hover:bg-[#FFF3F2]"
                            >
                              <X className="h-4 w-4" />
                              <span>Удалить</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </DroppableGroupHeader>
                {group.description && (
                  <p className="px-4 pb-3 pt-2 text-[14px] text-[rgba(37,52,71,0.84)] leading-[18px]">
                    {group.description}
                  </p>
                )}

                {/* Products */}
                <div>
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
                          <div className="relative overflow-hidden">
                            {/* Swipe delete background */}
                            <div 
                              className="absolute inset-0 flex items-center justify-end bg-[#FF4D4F] px-4 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Удалить товар "${product.name}"?`)) {
                                  deleteProduct(product.id, group.id);
                                }
                              }}
                            >
                              <span className="text-[15px] font-semibold text-white">Удалить</span>
                            </div>
                            
                            {/* Main product card */}
                            <div 
                              className="relative bg-white px-4 py-4 transition-transform"
                              style={{
                                touchAction: 'pan-y',
                              }}
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                const startX = touch.clientX;
                                const startTime = Date.now();
                                
                                const handleMove = (moveEvent: TouchEvent) => {
                                  const moveTouch = moveEvent.touches[0];
                                  const deltaX = moveTouch.clientX - startX;
                                  
                                  if (deltaX < 0) {
                                    const clampedDelta = Math.max(deltaX, -80);
                                    target.style.transform = `translateX(${clampedDelta}px)`;
                                  }
                                };
                                
                                const handleEnd = (endEvent: TouchEvent) => {
                                  const endTouch = endEvent.changedTouches[0];
                                  const deltaX = endTouch.clientX - startX;
                                  const deltaTime = Date.now() - startTime;
                                  const velocity = Math.abs(deltaX) / deltaTime;
                                  
                                  if (deltaX < -60 || velocity > 0.5) {
                                    target.style.transform = 'translateX(-80px)';
                                  } else {
                                    target.style.transform = 'translateX(0)';
                                  }
                                  
                                  document.removeEventListener('touchmove', handleMove);
                                  document.removeEventListener('touchend', handleEnd);
                                };
                                
                                document.addEventListener('touchmove', handleMove);
                                document.addEventListener('touchend', handleEnd);
                              }}
                              onClick={(e) => {
                                const target = e.currentTarget;
                                const transform = target.style.transform;
                                
                                if (transform && transform.includes('-80px')) {
                                  e.stopPropagation();
                                  target.style.transform = 'translateX(0)';
                                }
                              }}
                            >
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
                                  <span className="text-[14px] text-[rgba(13,45,94,0.56)]">{groupIndex + 1}.{productIndex + 1}</span>
                                  <span className="text-[14px] text-[rgba(13,45,94,0.56)]">{product.sku}</span>
                                  {product.hasUpdates && (
                                    <div className="w-2 h-2 rounded-full bg-[#EC3F39]" />
                                  )}
                                </div>
                                <h4 className="text-[16px] font-medium text-[#222934] leading-[20px] mb-2 line-clamp-3">
                                  {product.name}
                                </h4>
                                {product.clientCommentEnabled && product.comment && (
                                  <p className="text-[14px] text-[rgba(37,52,71,0.84)] leading-[18px] mb-2">
                                    {product.comment}
                                  </p>
                                )}
                                {((product.alternatives?.length ?? 0) > 0 || (product.addons?.length ?? 0) > 0) && (
                                  <div className="mb-2 flex flex-wrap gap-1.5">
                                    {(product.alternatives?.length ?? 0) > 0 && (
                                    <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[rgba(13,45,94,0.64)]">
                                      {product.alternatives?.length} {alternativesForm(product.alternatives?.length ?? 0)}
                                    </span>
                                  )}
                                  {(product.addons?.length ?? 0) > 0 && (
                                      <span className="rounded-full bg-[rgba(13,45,94,0.06)] px-2 py-1 text-[12px] font-medium text-[rgba(13,45,94,0.64)]">
                                        {product.addons?.length} {addonsForm(product.addons?.length ?? 0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-[14px] font-medium text-[#8A99B8]">
                                    {product.quantity} {pluralize(product.quantity, ['штука', 'штуки', 'штук'])}
                                  </span>
                                  <div className="flex flex-col items-end">
                                    {product.discount ? (
                                      <span className="text-[12px] text-[rgba(13,45,94,0.56)] leading-none mb-0.5">
                                        −{product.discount.toFixed(2)}%
                                      </span>
                                    ) : null}
                                    <span className="text-[16px] font-bold text-[#222934]">
                                      {(product.price * product.quantity * (1 - (product.discount || 0) / 100)).toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                          </div>
                        </DraggableProduct>
                        {productIndex < group.products.length - 1 && (
                          <div className="px-2">
                            <div className="h-[2px] rounded-[2px] bg-[rgba(13,45,94,0.04)]" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Group Total */}
                    <div className="px-2 pt-1">
                      <div className="h-px bg-[rgba(13,45,94,0.08)]" />
                    </div>
                    <div className="px-4 py-2 flex flex-col gap-1 items-end">
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
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-2 pb-2">
        <div
          className="rounded-[12px] border-t border-[rgba(13,45,94,0.04)] px-4 py-3"
          style={{
            background: 'linear-gradient(90deg, rgba(13, 45, 94, 0.28) 0%, rgba(13, 45, 94, 0.28) 100%), linear-gradient(90deg, rgb(62, 71, 86) 0%, rgb(62, 71, 86) 100%)'
          }}
        >
        <div className="flex flex-col gap-3">
          {/* Piggy Bank Details - Expandable */}
          {isPiggyExpanded && (
            <>
              <div className="grid grid-cols-3 gap-2 text-white">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-white/60 mb-1">Накопили</span>
                  <span className="text-[13px] font-semibold">0,00 ₽</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-white/60 mb-1">Списали</span>
                  <span className="text-[13px] font-semibold">0,00 ₽</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-white/60 mb-1">Осталось</span>
                  <span className="text-[13px] font-semibold">1 000 000,00 ₽</span>
                </div>
              </div>
            </>
          )}

          {/* Main Footer Content */}
          <div className="flex items-center gap-3 justify-between">
            {/* Left Side - Amounts */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 flex-shrink-0">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.25 12.25">
                    <path clipRule="evenodd" d={svgPaths.p3bc5ae80} fill="#3CAA3C" fillRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-[#3CAA3C] leading-none">52 000,00 ₽</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold text-white leading-none tracking-tight">{formattedTotalAmount} ₽</span>
                <div className="w-4 h-4 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#EC3F39"/>
                    <path d="M8 4V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="11.5" r="0.75" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Piggy Bank Button with notification dot */}
            <button
              onClick={() => setIsPiggyExpanded(!isPiggyExpanded)}
              className="relative flex items-center justify-center w-11 h-11 rounded-[10px] hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Копилка"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <g clipPath="url(#clip0_37_7323)">
                  <g clipPath="url(#clip1_37_7323)">
                    <path d="M5.87497 9.50003C6.42725 9.50003 6.87497 9.05232 6.87497 8.50003C6.87497 7.94775 6.42725 7.50003 5.87497 7.50003C5.32268 7.50003 4.87497 7.94775 4.87497 8.50003C4.87497 9.05232 5.32268 9.50003 5.87497 9.50003Z" fill="white"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.92389 3.33143C9.33498 1.66957 10.8361 0.4375 12.625 0.4375C14.7306 0.4375 16.4375 2.14442 16.4375 4.25C16.4375 4.82967 16.3081 5.37912 16.0767 5.87106C16.2183 5.92353 16.3491 6.01103 16.4555 6.13263C17.1108 6.88151 17.5885 7.75641 17.8456 8.715C17.8578 8.70557 17.8691 8.69592 17.8797 8.68613C17.9513 8.62004 18.0394 8.50209 18.1295 8.27683C18.3218 7.79609 18.8674 7.56226 19.3482 7.75456C19.8289 7.94685 20.0627 8.49245 19.8704 8.97318C19.7105 9.37292 19.4861 9.75497 19.1515 10.0639C18.84 10.3514 18.4716 10.5399 18.0592 10.6414C18.0041 12.8255 17.2597 14.8833 15.323 16.0026L14.7911 18.4491C14.6974 18.8801 14.316 19.1875 13.875 19.1875H5.75C5.33737 19.1875 4.97326 18.9177 4.85312 18.5229L4.12187 16.1203C3.75679 15.9617 3.43267 15.7291 3.1668 15.4765C2.76442 15.0943 2.42513 14.6005 2.24311 14.0686L2.23669 14.0602C2.21971 14.039 2.19207 14.0112 2.15625 13.9844C2.12542 13.9612 2.09813 13.946 2.07951 13.9375H1C0.482233 13.9375 0.0625 13.5177 0.0625 13V8.24998C0.0625 7.73221 0.482233 7.31248 1 7.31248H2.125C2.12756 7.3126 2.15437 7.31389 2.21875 7.26561C2.27752 7.22152 2.34494 7.15204 2.41528 7.05761C2.60167 6.57592 2.80102 6.16893 3.12515 5.80159C3.35089 5.54575 3.61589 5.33443 3.9169 5.1287L3.81325 2.53745C3.81275 2.52497 3.8125 2.51247 3.8125 2.49998C3.8125 2.11915 3.94048 1.66891 4.31176 1.35068C4.70707 1.01184 5.21131 0.964714 5.64841 1.1031C6.44288 1.33168 7.91884 1.87682 8.92389 3.33143ZM10.6875 4.25C10.6875 3.17995 11.5549 2.3125 12.625 2.3125C13.6951 2.3125 14.5625 3.17995 14.5625 4.25C14.5625 5.31639 13.701 6.18157 12.636 6.18747H12.614C11.549 6.18157 10.6875 5.31639 10.6875 4.25ZM9.54885 6.50265C9.3438 6.22312 9.17593 5.91459 9.05254 5.58438C9.0269 5.59748 9.00044 5.60952 8.97318 5.62043C8.49244 5.81272 7.94685 5.57889 7.75455 5.09816C7.30207 3.96695 6.44386 3.40617 5.71248 3.10573L5.81175 5.58751C5.8252 5.92385 5.65731 6.24158 5.37187 6.41998C4.86883 6.73438 4.66503 6.89033 4.5311 7.04213C4.41156 7.1776 4.30344 7.36081 4.12781 7.82916C4.10263 7.89631 4.06983 7.96034 4.03005 8.02001C3.7423 8.45164 3.12269 9.18748 2.125 9.18748H1.9375V12.0625H2.125C2.58946 12.0625 3.00294 12.2756 3.28125 12.4844C3.56449 12.6968 3.87247 13.0278 4.01439 13.4535C4.08429 13.6632 4.24117 13.911 4.4582 14.1172C4.67937 14.3273 4.89111 14.4272 5.02912 14.4502C5.38041 14.5088 5.66819 14.7613 5.77188 15.102L6.44463 17.3125H8.8125V16.25C8.8125 15.7323 9.23223 15.3125 9.75 15.3125C10.2678 15.3125 10.6875 15.7323 10.6875 16.25V17.3125H13.1194L13.5839 15.1758C13.6461 14.8898 13.8383 14.6492 14.1035 14.5254C15.513 13.8677 16.1875 12.4388 16.1875 10.375C16.1875 9.3631 15.8626 8.43402 15.2755 7.65202C15.1067 7.89977 14.8224 8.06247 14.5 8.06247H12.6404C12.6353 8.06249 12.6301 8.0625 12.625 8.0625C12.6199 8.0625 12.6147 8.06249 12.6096 8.06247H10.25C9.73226 8.06247 9.31253 7.64274 9.31253 7.12497C9.31253 6.88615 9.40183 6.66819 9.54885 6.50265Z" fill="white"/>
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_37_7323">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                  <clipPath id="clip1_37_7323">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="absolute right-0.5 top-0.5 w-1.5 h-1.5 bg-[#EC3F39] rounded-full"></span>
            </button>

            {/* Broadcast/Radio Button */}
            <button className="flex items-center justify-center w-11 h-11 bg-[#007FFF] rounded-[10px] hover:bg-[#0066CC] transition-colors flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.95001 5.50379C7.28751 5.89629 7.22876 6.48379 6.93126 6.90754C6.48692 7.53821 6.24892 8.29106 6.25001 9.06254C6.25001 9.86504 6.50251 10.6088 6.93126 11.2175C7.22876 11.6413 7.28626 12.2288 6.95001 12.6213C6.61251 13.015 6.01251 13.0638 5.68126 12.6663C4.83566 11.656 4.37315 10.38 4.37501 9.06254C4.37501 7.69129 4.86626 6.43504 5.68126 5.45879C6.01376 5.06129 6.61251 5.11004 6.95001 5.50379ZM13.05 5.50379C12.7125 5.89629 12.7713 6.48379 13.0688 6.90754C13.4988 7.51629 13.75 8.26004 13.75 9.06254C13.75 9.86504 13.4988 10.6088 13.0688 11.2175C12.7713 11.6413 12.7138 12.2288 13.05 12.6213C13.3875 13.015 13.9875 13.0638 14.3188 12.6663C15.1644 11.656 15.6269 10.38 15.625 9.06254C15.6269 7.74507 15.1644 6.46909 14.3188 5.45879C13.9875 5.06129 13.3875 5.11004 13.05 5.50379ZM15.4913 2.65629C15.1538 3.05004 15.2038 3.63754 15.5538 4.02129C16.8087 5.40007 17.5029 7.19817 17.5 9.06254C17.5 11.0038 16.7625 12.7725 15.5525 14.1038C15.205 14.4875 15.1538 15.075 15.49 15.4688C15.8275 15.8613 16.4238 15.91 16.7813 15.535C18.4487 13.7931 19.3781 11.4739 19.375 9.06254C19.375 6.55254 18.3875 4.27254 16.7813 2.59004C16.4238 2.21504 15.8275 2.26379 15.4913 2.65629ZM4.50876 2.65629C4.17126 2.26379 3.57626 2.21504 3.21876 2.59004C1.55138 4.33202 0.622014 6.65118 0.625007 9.06254C0.625007 11.5725 1.61251 13.8525 3.21876 15.535C3.57626 15.91 4.17251 15.8613 4.50876 15.4688C4.84626 15.075 4.79626 14.4875 4.44626 14.1038C3.19133 12.725 2.49715 10.9269 2.50001 9.06254C2.50001 7.12129 3.23751 5.35254 4.44751 4.02129C4.79501 3.63754 4.84501 3.05004 4.50876 2.65629ZM10.9375 10.6875C11.295 10.4812 11.5743 10.1626 11.7323 9.78127C11.8902 9.39994 11.9179 8.97714 11.8111 8.57846C11.7043 8.17977 11.4689 7.82747 11.1414 7.5762C10.814 7.32494 10.4128 7.18874 10 7.18874C9.58726 7.18874 9.18604 7.32494 8.85858 7.5762C8.53112 7.82747 8.29572 8.17977 8.1889 8.57846C8.08207 8.97714 8.10978 9.39994 8.26773 9.78127C8.42569 10.1626 8.70505 10.4812 9.06251 10.6875V17.8138C9.06251 18.0624 9.16128 18.3009 9.33709 18.4767C9.51291 18.6525 9.75137 18.7513 10 18.7513C10.2486 18.7513 10.4871 18.6525 10.6629 18.4767C10.8387 18.3009 10.9375 18.0624 10.9375 17.8138V10.6875Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Client Drawer */}
      {isClientDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeClientDrawer}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[82vh] flex-col rounded-t-2xl bg-white">
            <div className="border-b border-[rgba(13,45,94,0.08)] px-4 py-3">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[rgba(13,45,94,0.16)]" />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-bold text-[#222934]">Клиент</h3>
                <button
                  onClick={closeClientDrawer}
                  className="rounded-lg p-2 transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                  aria-label="Закрыть выбор клиента"
                >
                  <X className="h-5 w-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-4">
                <label className="block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(13,45,94,0.48)]" />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setClientSearchQuery(value);
                        setClientDraft(prev => ({
                          ...prev,
                          name: prev.name || value
                        }));
                      }}
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.16)] bg-white pl-10 pr-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="Имя, компания или телефон"
                    />
                  </div>
                </label>

                <div className="space-y-2">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-[rgba(13,45,94,0.08)] bg-white p-3 text-left transition-colors hover:bg-[rgba(13,45,94,0.03)]"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
                        <UserRound className="h-[18px] w-[18px] text-[#007FFF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-bold text-[#222934]">{client.name}</div>
                        <div className="mt-0.5 truncate text-[13px] font-medium text-[rgba(13,45,94,0.56)]">
                          {[client.company, client.phone].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-[13px] font-semibold text-[#007FFF]">Выбрать</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-[18px] bg-[#F7F9FC] p-4">
                  <div className="mb-3 text-[15px] font-bold text-[#222934]">Новый клиент</div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={clientDraft.name}
                      onChange={(event) => setClientDraft(prev => ({ ...prev, name: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="ФИО"
                    />
                    <input
                      type="text"
                      value={clientDraft.company}
                      onChange={(event) => setClientDraft(prev => ({ ...prev, company: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="Компания"
                    />
                    <input
                      type="tel"
                      value={clientDraft.phone}
                      onChange={(event) => setClientDraft(prev => ({ ...prev, phone: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="Телефон"
                    />
                    <input
                      type="email"
                      value={clientDraft.email || ''}
                      onChange={(event) => setClientDraft(prev => ({ ...prev, email: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-[rgba(13,45,94,0.12)] bg-white px-3 text-[15px] font-medium text-[#222934] outline-none transition-shadow focus:ring-2 focus:ring-[#007FFF]/20"
                      placeholder="Email"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={createClientFromDraft}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-[#007FFF] px-4 text-[15px] font-semibold text-white disabled:opacity-50"
                    disabled={!clientDraft.name.trim()}
                  >
                    Создать клиента
                  </button>
                </div>
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

      {groupContextMenuId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setGroupContextMenuId(null)}
        />
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
              <div className="flex items-center justify-between gap-3">
                <div className="text-[18px] font-bold text-[#222934]">Меню оффера</div>
                <button
                  onClick={() => setIsOfferMenuOpen(false)}
                  className="p-2 hover:bg-[rgba(13,45,94,0.04)] rounded-lg transition-colors"
                  aria-label="Закрыть меню"
                >
                  <X className="w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <div className="overflow-hidden rounded-[18px] border border-[rgba(13,45,94,0.08)] bg-white">
                <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[rgba(13,45,94,0.03)]">
                  <div className="text-[16px] font-medium text-[#222934]">Ответственные</div>
                  <div className="flex items-center">
                    <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white">
                      <img src={imgAvatar} alt="Анна" className="h-full w-full object-cover" />
                    </div>
                    <div className="-ml-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[rgba(13,45,94,0.08)] px-1">
                      <span className="text-[10px] font-medium text-[rgba(13,45,94,0.56)]">+2</span>
                    </div>
                  </div>
                </button>
                <div className="mx-4 h-px bg-[rgba(13,45,94,0.08)]" />
                <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[rgba(13,45,94,0.03)]">
                  <span className="text-[16px] font-medium text-[#222934]">История изменений</span>
                  {hasUpdates && <span className="h-2 w-2 rounded-full bg-[#EC3F39]" />}
                </button>
                <div className="mx-4 h-px bg-[rgba(13,45,94,0.08)]" />
                <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[rgba(13,45,94,0.03)]">
                  <span className="text-[16px] font-medium text-[#222934]">Настройки оффера</span>
                </button>
              </div>
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
                  <h3 className="text-[18px] font-bold text-[#222934]">Проблемы КП</h3>
                  <p className="mt-1 text-[13px] text-[#8A99B8]">Проверьте перед публикацией</p>
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
            <div className="space-y-3 p-3">
              {!hasResponsibleManager && (
                <div className="rounded-[18px] border border-[rgba(13,45,94,0.08)] bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF1F0]">
                      <User className="h-5 w-5 text-[#EC3F39]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-semibold text-[#222934]">Нет ответственного менеджера</div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => openIssueEntity('managers')}
                          className="flex h-10 items-center justify-center rounded-[12px] bg-[rgba(13,45,94,0.04)] px-4 text-[14px] font-semibold text-[#222934]"
                        >
                          Выбрать
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {hasLostEntities && (
                <div className="rounded-[18px] border border-[rgba(13,45,94,0.08)] bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7E6]">
                      <TriangleAlert className="h-5 w-5 text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[16px] font-semibold text-[#222934]">Есть потерянные сущности</div>
                        <button className="flex h-9 items-center justify-center rounded-[10px] bg-[rgba(13,45,94,0.04)] px-3 text-[13px] font-semibold text-[#222934]">
                          Отвязать все
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => openIssueEntity('products')}
                          className="flex w-full items-center justify-between px-0 py-2 text-left"
                        >
                          <span className="text-[15px] font-medium text-[#222934]">Товары</span>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#EC3F39] px-2 text-[13px] font-semibold text-white">
                              {lostProductsCount}
                            </span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 15L12.5 10L7.5 5" stroke="#8A99B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {hasUpdates && (
                <div className="rounded-[18px] border border-[rgba(13,45,94,0.08)] bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF7E6]">
                      <RotateCcw className="h-5 w-5 text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[16px] font-semibold text-[#222934]">Есть что отролбэчить</div>
                        <button className="flex h-9 items-center justify-center rounded-[10px] bg-[rgba(13,45,94,0.04)] px-3 text-[13px] font-semibold text-[#222934]">
                          Сбросить все
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => openIssueEntity('products')}
                          className="flex w-full items-center justify-between px-0 py-2 text-left"
                        >
                          <span className="text-[15px] font-medium text-[#222934]">Товары</span>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#EC3F39] px-2 text-[13px] font-semibold text-white">
                              {updatedProductsCount}
                            </span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 15L12.5 10L7.5 5" stroke="#8A99B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                        {updatedDeliveriesCount > 0 && (
                          <button
                            type="button"
                            onClick={() => openIssueEntity('deliveries')}
                            className="flex w-full items-center justify-between px-0 py-2 text-left"
                          >
                            <span className="text-[15px] font-medium text-[#222934]">Доставки</span>
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#EC3F39] px-2 text-[13px] font-semibold text-white">
                                {updatedDeliveriesCount}
                              </span>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="#8A99B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </button>
                        )}
                        {updatedPaymentsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => openIssueEntity('payments')}
                            className="flex w-full items-center justify-between px-0 py-2 text-left"
                          >
                            <span className="text-[15px] font-medium text-[#222934]">Оплаты</span>
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#EC3F39] px-2 text-[13px] font-semibold text-white">
                                {updatedPaymentsCount}
                              </span>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="#8A99B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  onDelete={deleteGroup}
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
              <div className="border-b border-[rgba(13,45,94,0.08)] px-4 pb-3">
                <div className="grid grid-cols-2 gap-2 rounded-[12px] bg-[#F3F6FA] p-1">
                <button
                  onClick={() => setAlternativeSource('offer')}
                  className={`flex h-10 items-center justify-center rounded-[10px] px-3 text-[14px] font-semibold transition-colors ${
                    alternativeSource === 'offer'
                      ? 'bg-white text-[#222934] shadow-[0_1px_2px_rgba(13,45,94,0.06)]'
                      : 'text-[rgba(13,45,94,0.56)]'
                  }`}
                >
                  Из оффера
                </button>
                <button
                  onClick={() => setAlternativeSource('catalog')}
                  className={`flex h-10 items-center justify-center rounded-[10px] px-3 text-[14px] font-semibold transition-colors ${
                    alternativeSource === 'catalog'
                      ? 'bg-white text-[#222934] shadow-[0_1px_2px_rgba(13,45,94,0.06)]'
                      : 'text-[rgba(13,45,94,0.56)]'
                  }`}
                >
                  Из каталога
                </button>
                </div>
              </div>
            )}

            <div className={`flex-1 overflow-y-auto p-3 ${!isProductDrawerSubscreen ? 'pb-28' : ''}`}>{relatedItemEditor && selectedRelatedItem ? (
              relatedItemSubscreen === 'content' ? (
                <div className="space-y-4">
                  <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Анонс</span>
                    <textarea
                      value={relatedItemDraft.shortDescription}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, shortDescription: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      placeholder="Короткое описание в пару строк"
                      className="min-h-20 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                    />
                  </label>

                  <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Полное описание</span>
                    <textarea
                      value={relatedItemDraft.fullDescription}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, fullDescription: event.target.value }))}
                      placeholder="Длинное описание товара"
                      className="min-h-56 w-full resize-y bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                    />
                    <span className="mt-2 block text-[12px] font-medium text-[#9AA8C1]">
                      {relatedItemDraft.fullDescription.length.toLocaleString('ru-RU')} символов
                    </span>
                  </label>

                  <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Ссылка</span>
                    <input
                      value={relatedItemDraft.link}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, link: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      placeholder="https://"
                      className="h-11 w-full bg-transparent text-[15px] font-medium text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                    />
                  </label>
                </div>
              ) : relatedItemEditor.kind === 'alternative' ? (
                <div className="space-y-5">
                  <div className="rounded-[22px] bg-white px-2 pb-1">
                    <div className="flex min-h-[220px] items-center justify-center px-6 pt-3">
                      {selectedRelatedItem.image ? (
                        <img src={selectedRelatedItem.image} alt={selectedRelatedItem.name} className="max-h-[190px] w-auto object-contain" />
                      ) : (
                        <div className="flex h-[180px] w-full items-center justify-center rounded-[18px] bg-[rgba(13,45,94,0.04)] text-[rgba(13,45,94,0.28)]">
                          <Package className="h-14 w-14" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 px-1">
                    <div className="inline-flex max-w-full rounded-[8px] bg-[#F1F6FF] px-2.5 py-1 text-[12px] font-medium text-[#6C7FA7]">
                      <input
                        value={relatedItemDraft.sku}
                        onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, sku: event.target.value }))}
                        onBlur={() => saveRelatedItemEdit(false)}
                        className="w-full min-w-0 bg-transparent uppercase tracking-[0.01em] outline-none"
                      />
                    </div>

                    <label className="block border-b border-[rgba(13,45,94,0.12)] pb-4">
                      <textarea
                        rows={3}
                        value={relatedItemDraft.name}
                        onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, name: event.target.value }))}
                        onBlur={() => saveRelatedItemEdit(false)}
                        className="w-full resize-none bg-transparent text-[18px] font-bold leading-[1.3] text-[#222934] outline-none"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-[rgba(13,45,94,0.12)] pb-4">
                      <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                        <span className="block text-[13px] font-medium text-[#8A99B8]">Цена, руб.</span>
                        <input
                          inputMode="decimal"
                          value={relatedItemDraft.price}
                          onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, price: event.target.value }))}
                          onBlur={() => saveRelatedItemEdit(false)}
                          className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                        />
                      </label>
                      <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                        <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Количество</span>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => adjustRelatedDraftQuantity(-1)}
                            disabled={parseDecimalInput(relatedItemDraft.quantity, 1) <= 1}
                            aria-label="Уменьшить количество"
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                          >
                            −
                          </button>
                          <input
                            inputMode="decimal"
                            value={relatedItemDraft.quantity}
                            onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, quantity: event.target.value }))}
                            onBlur={() => saveRelatedItemEdit(false)}
                            className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustRelatedDraftQuantity(1)}
                            aria-label="Увеличить количество"
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                        <span className="block text-[13px] font-medium text-[#8A99B8]">Цена со скидкой, руб.</span>
                        <input
                          key={`related-alt-discounted-${relatedItemDraft.price}-${relatedItemDraft.discount}`}
                          inputMode="decimal"
                          defaultValue={formatProductMoney(
                            parseDecimalInput(relatedItemDraft.price || '0') * (1 - parseDecimalInput(relatedItemDraft.discount || '0') / 100)
                          )}
                          onBlur={(event) => updateRelatedDraftDiscountedPrice(event.target.value)}
                          className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                        />
                      </label>
                      <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                        <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Скидка, %</span>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => adjustRelatedDraftDiscount(-1)}
                            disabled={parseDecimalInput(relatedItemDraft.discount, 0) <= 0}
                            aria-label="Уменьшить скидку на 1 процент"
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                          >
                            −
                          </button>
                          <input
                            inputMode="decimal"
                            value={relatedItemDraft.discount}
                            onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, discount: event.target.value }))}
                            onBlur={() => saveRelatedItemEdit(false)}
                            placeholder="0"
                            className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none placeholder:text-[#C7D1E3]"
                          />
                          <button
                            type="button"
                            onClick={() => adjustRelatedDraftDiscount(1)}
                            disabled={parseDecimalInput(relatedItemDraft.discount, 0) >= 100}
                            aria-label="Увеличить скидку на 1 процент"
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC] disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-bold text-[#222934]">Комментарий</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextDraft = {
                              ...relatedItemDraft,
                              clientCommentEnabled: !relatedItemDraft.clientCommentEnabled
                            };
                            setRelatedItemDraft(nextDraft);
                            saveRelatedItemEdit(false, nextDraft);
                          }}
                          className={`relative h-7 w-12 flex-shrink-0 rounded-full p-0.5 transition-colors ${relatedItemDraft.clientCommentEnabled ? 'bg-[#1D77FF]' : 'bg-[#D9E0EC]'}`}
                          aria-label="Комментарий для клиента"
                        >
                          <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${relatedItemDraft.clientCommentEnabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {relatedItemDraft.clientCommentEnabled && (
                        <label className="mt-4 block">
                          <textarea
                            value={relatedItemDraft.comment}
                            onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, comment: event.target.value }))}
                            onBlur={() => saveRelatedItemEdit(false)}
                            placeholder="Комментарий будет показан клиенту"
                            className="min-h-24 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                          />
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={openRelatedItemContentScreen}
                      className="flex w-full items-center justify-between rounded-[16px] bg-[#F7F9FC] px-4 py-4 text-left"
                    >
                      <div className="text-[14px] font-bold text-[#222934]">Контент</div>
                      <ChevronDown className="-rotate-90 h-4 w-4 text-[#7D8FB3]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Удалить вариант "${relatedItemDraft.name}" из оффера?`)) {
                          deleteRelatedItem('alternative', relatedItemEditor.itemId);
                        }
                      }}
                      className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#FDEEEE] px-4 text-[15px] font-medium text-[#FF4D4F]"
                    >
                      Удалить вариант
                    </button>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => setRelatedItemActionsOpen(prev => !prev)}
                        className="flex w-full items-center justify-between text-[13px] font-medium text-[#8A99B8] py-2"
                      >
                        <span>Или преобразовать в...</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${relatedItemActionsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {relatedItemActionsOpen && (
                        <div className="mt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => promoteRelatedItemToMain('alternative', relatedItemEditor.itemId)}
                            className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                          >
                            Основной товар
                          </button>
                          <button
                            type="button"
                            onClick={() => convertRelatedItemKind(relatedItemEditor.itemId, 'alternative', 'addon')}
                            className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                          >
                            Дополнение
                          </button>
                          <button
                            type="button"
                            onClick={returnRelatedItemToGroup}
                            className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                          >
                            Обычный товар в группе
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-[22px] bg-white px-2 pb-1">
                    <div className="flex min-h-[220px] items-center justify-center px-6 pt-3">
                      {selectedRelatedItem.image ? (
                        <img src={selectedRelatedItem.image} alt={selectedRelatedItem.name} className="max-h-[190px] w-auto object-contain" />
                      ) : (
                        <div className="flex h-[180px] w-full items-center justify-center rounded-[18px] bg-[rgba(13,45,94,0.04)] text-[rgba(13,45,94,0.28)]">
                          <Package className="h-14 w-14" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 px-1">
                  <div className="inline-flex max-w-full rounded-[8px] bg-[#F1F6FF] px-2.5 py-1 text-[12px] font-medium text-[#6C7FA7]">
                    <input
                      value={relatedItemDraft.sku}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, sku: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      className="w-full min-w-0 bg-transparent uppercase tracking-[0.01em] outline-none"
                    />
                  </div>

                  <label className="block border-b border-[rgba(13,45,94,0.12)] pb-4">
                    <textarea
                      rows={3}
                      value={relatedItemDraft.name}
                      onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, name: event.target.value }))}
                      onBlur={() => saveRelatedItemEdit(false)}
                      className="w-full resize-none bg-transparent text-[18px] font-bold leading-[1.3] text-[#222934] outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-[rgba(13,45,94,0.12)] pb-4">
                    <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-[13px] font-medium text-[#8A99B8]">Цена, руб.</span>
                      <input
                        inputMode="decimal"
                        value={relatedItemDraft.price}
                        onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, price: event.target.value }))}
                        onBlur={() => saveRelatedItemEdit(false)}
                        className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Количество</span>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => adjustRelatedDraftQuantity(-1)}
                          disabled={parseDecimalInput(relatedItemDraft.quantity, 1) <= 1}
                          aria-label="Уменьшить количество"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          inputMode="decimal"
                          value={relatedItemDraft.quantity}
                          onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, quantity: event.target.value }))}
                          onBlur={() => saveRelatedItemEdit(false)}
                          className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustRelatedDraftQuantity(1)}
                          aria-label="Увеличить количество"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-[13px] font-medium text-[#8A99B8]">Цена со скидкой, руб.</span>
                      <input
                        key={`related-addon-discounted-${relatedItemDraft.price}-${relatedItemDraft.discount}`}
                        inputMode="decimal"
                        defaultValue={formatProductMoney(
                          parseDecimalInput(relatedItemDraft.price || '0') * (1 - parseDecimalInput(relatedItemDraft.discount || '0') / 100)
                        )}
                        onBlur={(event) => updateRelatedDraftDiscountedPrice(event.target.value)}
                        className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Скидка, %</span>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => adjustRelatedDraftDiscount(-1)}
                          disabled={parseDecimalInput(relatedItemDraft.discount, 0) <= 0}
                          aria-label="Уменьшить скидку на 1 процент"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          inputMode="decimal"
                          value={relatedItemDraft.discount}
                          onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, discount: event.target.value }))}
                          onBlur={() => saveRelatedItemEdit(false)}
                          placeholder="0"
                          className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none placeholder:text-[#C7D1E3]"
                        />
                        <button
                          type="button"
                          onClick={() => adjustRelatedDraftDiscount(1)}
                          disabled={parseDecimalInput(relatedItemDraft.discount, 0) >= 100}
                          aria-label="Увеличить скидку на 1 процент"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-bold text-[#222934]">Комментарий</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextDraft = {
                            ...relatedItemDraft,
                            clientCommentEnabled: !relatedItemDraft.clientCommentEnabled
                          };
                          setRelatedItemDraft(nextDraft);
                          saveRelatedItemEdit(false, nextDraft);
                        }}
                        className={`relative h-7 w-12 flex-shrink-0 rounded-full p-0.5 transition-colors ${relatedItemDraft.clientCommentEnabled ? 'bg-[#1D77FF]' : 'bg-[#D9E0EC]'}`}
                        aria-label="Комментарий для клиента"
                      >
                        <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${relatedItemDraft.clientCommentEnabled ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    {relatedItemDraft.clientCommentEnabled && (
                      <label className="mt-4 block">
                        <textarea
                          value={relatedItemDraft.comment}
                          onChange={(event) => setRelatedItemDraft(prev => ({ ...prev, comment: event.target.value }))}
                          onBlur={() => saveRelatedItemEdit(false)}
                          placeholder="Комментарий будет показан клиенту"
                          className="min-h-24 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={openRelatedItemContentScreen}
                    className="flex w-full items-center justify-between rounded-[16px] bg-[#F7F9FC] px-4 py-4 text-left"
                  >
                    <div className="text-[14px] font-bold text-[#222934]">Контент</div>
                    <ChevronDown className="-rotate-90 h-4 w-4 text-[#7D8FB3]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Удалить дополнение "${relatedItemDraft.name}" из оффера?`)) {
                        deleteRelatedItem('addon', relatedItemEditor.itemId);
                      }
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#FDEEEE] px-4 text-[15px] font-medium text-[#FF4D4F]"
                  >
                    Удалить дополнение
                  </button>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setRelatedItemActionsOpen(prev => !prev)}
                      className="flex w-full items-center justify-between text-[13px] font-medium text-[#8A99B8] py-2"
                    >
                      <span>Или преобразовать в...</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${relatedItemActionsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {relatedItemActionsOpen && (
                      <div className="mt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => promoteRelatedItemToMain('addon', relatedItemEditor.itemId)}
                          className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                        >
                          Основной товар
                        </button>
                        <button
                          type="button"
                          onClick={() => convertRelatedItemKind(relatedItemEditor.itemId, 'addon', 'alternative')}
                          className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                        >
                          Вариант
                        </button>
                        <button
                          type="button"
                          onClick={returnRelatedItemToGroup}
                          className="flex h-11 w-full items-center justify-start rounded-[12px] bg-[#F7F9FC] px-4 text-[14px] font-medium text-[#5A6C8F]"
                        >
                          Обычный товар в группе
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )
            ) : isMoveToGroupMode ? (
              <div className="space-y-3 px-1">
                <div className="rounded-[18px] bg-[#F7F9FC] px-4 py-3 text-[13px] font-medium text-[#7D8FB3]">
                  Выбери группу, в которую нужно перенести товар.
                </div>
                {groups.filter(g => g.id !== selectedProduct.groupId).map(group => (
                  <button
                    key={group.id}
                    onClick={() => moveProductToGroup(selectedProductModel.id, selectedProduct.groupId, group.id)}
                    className="w-full rounded-[18px] border border-[rgba(13,45,94,0.08)] bg-white px-4 py-4 text-left transition-colors hover:bg-[rgba(13,45,94,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold text-[#222934]">{group.name}</div>
                        <div className="mt-1 text-[13px] font-medium text-[#8A99B8]">{group.products.length} {positionsForm(group.products.length)}</div>
                      </div>
                      <ChevronDown className="-rotate-90 h-4 w-4 flex-shrink-0 text-[#7D8FB3]" />
                    </div>
                  </button>
                ))}
              </div>
            ) : isAddAlternativeMode ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  {alternativeSource === 'offer' && (
                    <div className="space-y-2 px-3 py-3">
                      {getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).length === 0 ? (
                        <div className="rounded-[16px] bg-[#F7F9FC] px-4 py-8 text-center">
                          <div className="text-[15px] font-medium text-[#5A6C8F]">Нет доступных товаров</div>
                          <div className="mt-1 text-[13px] text-[#8A99B8]">Все товары уже добавлены</div>
                        </div>
                      ) : (
                        getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).map(({ product, groupId }) => {
                          const isSelected = selectedAlternativeIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              onClick={() => {
                                setSelectedAlternativeIds(prev => 
                                  isSelected ? prev.filter(id => id !== product.id) : [...prev, product.id]
                                );
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                            >
                              <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-[#007FFF] bg-[#007FFF]' : 'border-[#D1D9E6] bg-white'
                              }`}>
                                {isSelected && (
                                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                    <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-[15px] font-medium truncate ${product.name ? 'text-[#222934]' : 'text-[#C7D1E3]'}`}>
                                  {product.name || 'Название товара'}
                                </div>
                                <div className="text-[13px] text-[#8A99B8]">
                                  {product.quantity} шт.
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-[15px] font-medium text-[#222934]">
                                {formatProductMoney(product.price * product.quantity)} ₽
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {alternativeSource === 'catalog' && (
                    <div className="space-y-3 px-3 py-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(13,45,94,0.56)]" />
                        <input
                          type="text"
                          placeholder="Поиск в каталоге..."
                          className="h-11 w-full rounded-[12px] border border-[rgba(13,45,94,0.14)] bg-white pl-10 pr-4 text-[14px] font-medium text-[#222934] outline-none placeholder:text-[#9AA8C1] focus:ring-2 focus:ring-[#007FFF] focus:ring-opacity-20"
                        />
                      </div>
                      <div className="rounded-[16px] bg-[#F7F9FC] px-4 py-8 text-center">
                        <div className="text-[15px] font-medium text-[#5A6C8F]">Каталог товаров</div>
                        <div className="mt-1 text-[13px] text-[#8A99B8]">Здесь будет поиск по каталогу</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-[rgba(13,45,94,0.08)] p-3 bg-white space-y-2">
                  {selectedAlternativeIds.length > 0 && (
                    <button
                      onClick={() => {
                        selectedAlternativeIds.forEach(productId => {
                          const productInfo = getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId)
                            .find(p => p.product.id === productId);
                          if (productInfo) {
                            addAlternativeManually(selectedProductModel.id, selectedProduct.groupId, productId, productInfo.groupId);
                          }
                        });
                        setSelectedAlternativeIds([]);
                        setIsAddAlternativeMode(false);
                      }}
                      className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#007FFF] text-[15px] font-semibold text-white transition-colors hover:bg-[#0066CC]"
                    >
                      Добавить ({selectedAlternativeIds.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      createNewAlternative(selectedProductModel.id, selectedProduct.groupId);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#EDF5FF] text-[15px] font-semibold text-[#007FFF] transition-colors hover:bg-[#DCE9FF]"
                  >
                    <span className="text-[18px] leading-none">+</span>
                    Новый товар
                  </button>
                </div>
              </div>
            ) : isAddAddonMode ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-2 px-3 py-3">
                    {getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).length === 0 ? (
                      <div className="rounded-[16px] bg-[#F7F9FC] px-4 py-8 text-center">
                        <div className="text-[15px] font-medium text-[#5A6C8F]">Нет доступных товаров</div>
                        <div className="mt-1 text-[13px] text-[#8A99B8]">Все товары уже добавлены</div>
                      </div>
                    ) : (
                      getAllAvailableProducts(selectedProductModel.id, selectedProduct.groupId).map(({ product }) => {
                        const isSelected = selectedAddonIds.includes(product.id);
                        return (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedAddonIds(prev => 
                                isSelected ? prev.filter(id => id !== product.id) : [...prev, product.id]
                              );
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                          >
                            <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-[#007FFF] bg-[#007FFF]' : 'border-[#D1D9E6] bg-white'
                            }`}>
                              {isSelected && (
                                <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                  <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[15px] font-medium truncate ${product.name ? 'text-[#222934]' : 'text-[#C7D1E3]'}`}>
                                {product.name || 'Название товара'}
                              </div>
                              <div className="text-[13px] text-[#8A99B8]">
                                {product.quantity} шт.
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-[15px] font-medium text-[#222934]">
                              {formatProductMoney(product.price * product.quantity)} ₽
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="border-t border-[rgba(13,45,94,0.08)] p-3 bg-white space-y-2">
                  {selectedAddonIds.length > 0 && (
                    <button
                      onClick={() => {
                        selectedAddonIds.forEach(productId => {
                          addAddonManually(selectedProductModel.id, productId);
                        });
                        setSelectedAddonIds([]);
                        setIsAddAddonMode(false);
                      }}
                      className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#007FFF] text-[15px] font-semibold text-white transition-colors hover:bg-[#0066CC]"
                    >
                      Добавить ({selectedAddonIds.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      createNewAddon(selectedProductModel.id, selectedProduct.groupId);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#EDF5FF] text-[15px] font-semibold text-[#007FFF] transition-colors hover:bg-[#DCE9FF]"
                  >
                    <span className="text-[18px] leading-none">+</span>
                    Новый товар
                  </button>
                </div>
              </div>
            ) : productSubscreen === 'comment' ? (
              <div className="space-y-4 px-1">
                <button
                  type="button"
                  onClick={() => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { clientCommentEnabled: !selectedProductClientCommentEnabled })}
                  className={`flex w-full items-center justify-between rounded-[18px] px-4 py-4 text-left transition-colors ${
                    selectedProductClientCommentEnabled
                      ? 'bg-[#EEF6FF]'
                      : 'bg-[#F7F9FC]'
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-bold text-[#222934]">Показывать клиенту</div>
                    <div className="mt-1 text-[12px] font-medium text-[#8A99B8]">Комментарий будет виден в предложении</div>
                  </div>
                  <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${selectedProductClientCommentEnabled ? 'bg-[#007FFF]' : 'bg-[rgba(13,45,94,0.16)]'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${selectedProductClientCommentEnabled ? 'translate-x-5' : ''}`} />
                  </span>
                </button>

                {selectedProductClientCommentEnabled ? (
                  <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Комментарий для клиента</span>
                    <textarea
                      defaultValue={selectedProductModel.comment || ''}
                      onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { comment: event.target.value, clientCommentEnabled: true })}
                      placeholder="Что важно пояснить клиенту"
                      className="min-h-32 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                    />
                  </label>
                ) : (
                  <div className="rounded-[18px] bg-[#F7F9FC] px-4 py-5">
                    <div className="text-[14px] font-semibold text-[#5A6C8F]">Комментарий скрыт</div>
                    <div className="mt-1 text-[13px] leading-5 text-[#8A99B8]">
                      Включи переключатель выше, чтобы добавить комментарий и показать его клиенту.
                    </div>
                  </div>
                )}
              </div>
            ) : productSubscreen === 'content' ? (
              <div className="space-y-4 px-1">
                <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Анонс</span>
                  <textarea
                    value={productContentDraft.shortDescription}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, shortDescription: event.target.value }))}
                    onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { shortDescription: event.target.value })}
                    placeholder="Короткое описание в пару строк"
                    className="min-h-20 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                  />
                </label>

                <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Полное описание</span>
                  <textarea
                    value={productContentDraft.fullDescription}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, fullDescription: event.target.value }))}
                    placeholder="Длинное описание товара"
                    className="min-h-56 w-full resize-y bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                  />
                  <span className="mt-2 block text-[12px] font-medium text-[#9AA8C1]">
                    {productContentDraft.fullDescription.length.toLocaleString('ru-RU')} символов
                  </span>
                </label>

                <label className="block rounded-[18px] bg-[#F7F9FC] px-4 py-4">
                  <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.02em] text-[#8A99B8]">Ссылка</span>
                  <input
                    value={productContentDraft.link}
                    onChange={(event) => setProductContentDraft(prev => ({ ...prev, link: event.target.value }))}
                    onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { link: event.target.value })}
                    placeholder="https://"
                    className="h-11 w-full bg-transparent text-[15px] font-medium text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="px-0 pb-0">
                  <div className="flex min-h-[208px] items-center justify-center px-4 pt-1">
                    {selectedProductModel.image ? (
                      <img src={selectedProductModel.image} alt={selectedProductModel.name} className="max-h-[172px] w-auto object-contain" />
                    ) : (
                      <div className="flex h-[172px] w-full items-center justify-center rounded-[18px] bg-[rgba(13,45,94,0.04)] text-[rgba(13,45,94,0.28)]">
                        <Package className="h-14 w-14" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <div className="inline-flex max-w-full rounded-[8px] bg-[#F2F6FC] px-2.5 py-1 text-[12px] font-medium text-[#6E83AA]">
                    <input
                      defaultValue={selectedProductModel.sku}
                      onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { sku: event.target.value.trim() || selectedProductModel.sku })}
                      className="w-full min-w-0 bg-transparent uppercase tracking-[0.01em] outline-none"
                    />
                  </div>

                  <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                    <textarea
                      rows={1}
                      defaultValue={selectedProductModel.name}
                      onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { name: event.target.value.trim() || selectedProductModel.name })}
                      onInput={(event) => autoResizeTextarea(event.currentTarget, 3)}
                      ref={(node) => {
                        if (node) autoResizeTextarea(node, 3);
                      }}
                      className="w-full resize-none bg-transparent text-[17px] font-bold leading-[1.35] text-[#222934] outline-none"
                      style={{ minHeight: '1.35em', maxHeight: '4.05em' }}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-[13px] font-medium text-[#8A99B8]">Цена, руб.</span>
                      <input
                        inputMode="decimal"
                        defaultValue={selectedProductModel.price}
                        onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { price: parseDecimalInput(event.target.value, selectedProductModel.price) })}
                        className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Количество</span>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => adjustProductQuantity(selectedProduct.groupId, selectedProductModel.id, -1)}
                          disabled={selectedProductModel.quantity <= 1}
                          aria-label="Уменьшить количество"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          key={`product-qty-${selectedProductModel.quantity}`}
                          inputMode="decimal"
                          defaultValue={selectedProductModel.quantity}
                          onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { quantity: Math.max(1, parseDecimalInput(event.target.value, selectedProductModel.quantity)) })}
                          className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustProductQuantity(selectedProduct.groupId, selectedProductModel.id, 1)}
                          aria-label="Увеличить количество"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className="block border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-[13px] font-medium text-[#8A99B8]">Цена со скидкой, руб.</span>
                      <input
                        key={`product-discounted-${selectedProductModel.price}-${selectedProductDiscount}`}
                        inputMode="decimal"
                        defaultValue={formatProductMoney(selectedProductUnitPriceWithDiscount)}
                        onBlur={(event) => updateProductDiscountedPrice(selectedProduct.groupId, selectedProductModel, event.target.value)}
                        className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#222934] outline-none"
                      />
                    </label>
                    <div className="border-b border-[rgba(13,45,94,0.12)] pb-2">
                      <span className="block text-right text-[13px] font-medium text-[#8A99B8]">Скидка, %</span>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => adjustSelectedProductDiscount(-1)}
                          disabled={(selectedProductModel.discount ?? 0) <= 0}
                          aria-label="Уменьшить скидку на 1 процент"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#F2F4F8] text-[18px] font-medium text-[#0D2D5E] transition-colors hover:bg-[#E6E9EF] disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          key={`product-discount-${selectedProductModel.discount ?? 0}`}
                          inputMode="decimal"
                          defaultValue={selectedProductModel.discount ?? ''}
                          onBlur={(event) => {
                            const raw = event.target.value.trim();
                            if (!raw) {
                              updateProductFields(selectedProduct.groupId, selectedProductModel.id, { discount: undefined });
                              return;
                            }
                            const clamped = Math.max(0, Math.min(100, parseDecimalInput(raw, selectedProductDiscount)));
                            updateProductFields(selectedProduct.groupId, selectedProductModel.id, {
                              discount: clamped > 0 ? clamped : undefined
                            });
                          }}
                          placeholder="0"
                          className="min-w-0 flex-1 bg-transparent text-center text-[18px] font-bold text-[#222934] outline-none placeholder:text-[#C7D1E3]"
                        />
                        <button
                          type="button"
                          onClick={() => adjustSelectedProductDiscount(1)}
                          disabled={(selectedProductModel.discount ?? 0) >= 100}
                          aria-label="Увеличить скидку на 1 процент"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#007FFF] text-[18px] font-medium text-white transition-colors hover:bg-[#0066CC] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[16px] bg-[#F7F9FC] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[14px] font-bold text-[#222934]">Копилка</div>
                          <span className="rounded-full bg-[#FFF0E1] px-2.5 py-1 text-[12px] font-semibold text-[#FF8A00]">
                            {formatProductMoney(piggyAvailableAmount)} ₽
                          </span>
                        </div>
                      </div>
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
                        className={`relative h-7 w-12 rounded-full p-0.5 transition-colors ${selectedProductPiggyEnabled ? 'bg-[#1D77FF]' : 'bg-[#D9E0EC]'}`}
                        aria-label="Переключить копилку"
                      >
                        <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${selectedProductPiggyEnabled ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    {selectedProductPiggyEnabled && (
                      <div className="mt-4 grid grid-cols-2 gap-6">
                        <label className="block">
                          <span className="block text-[13px] font-medium text-[#7D8FB3]">Списать</span>
                          <input
                            inputMode="decimal"
                            value={selectedPiggyAdjustment.writeOff}
                            onChange={(event) => updatePiggyAdjustment(selectedProductModel.id, 'writeOff', event.target.value)}
                            placeholder="0.00"
                            className="mt-2 w-full bg-transparent text-[18px] font-bold text-[#C7D1E3] outline-none placeholder:text-[#C7D1E3]"
                          />
                        </label>
                        <label className="block text-right">
                          <span className="block text-[13px] font-medium text-[#7D8FB3]">Накинуть</span>
                          <input
                            inputMode="decimal"
                            value={selectedPiggyAdjustment.markup}
                            onChange={(event) => updatePiggyAdjustment(selectedProductModel.id, 'markup', event.target.value)}
                            placeholder="0.00"
                            className="mt-2 w-full bg-transparent text-right text-[18px] font-bold text-[#C7D1E3] outline-none placeholder:text-[#C7D1E3]"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[16px] bg-[#F7F9FC] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#222934]">Комментарий</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedProductClientCommentEnabled) {
                            updateProductFields(selectedProduct.groupId, selectedProductModel.id, { clientCommentEnabled: false });
                            return;
                          }
                          updateProductFields(selectedProduct.groupId, selectedProductModel.id, { clientCommentEnabled: true });
                        }}
                        className={`relative h-7 w-12 flex-shrink-0 rounded-full p-0.5 transition-colors ${selectedProductClientCommentEnabled ? 'bg-[#1D77FF]' : 'bg-[#D9E0EC]'}`}
                        aria-label="Переключить комментарий"
                      >
                        <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${selectedProductClientCommentEnabled ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    {selectedProductClientCommentEnabled && (
                      <label className="mt-4 block border-t border-[rgba(13,45,94,0.08)] pt-4">
                        <textarea
                          defaultValue={selectedProductModel.comment || ''}
                          onBlur={(event) => updateProductFields(selectedProduct.groupId, selectedProductModel.id, { comment: event.target.value, clientCommentEnabled: true })}
                          placeholder="Что важно пояснить клиенту"
                          className="min-h-28 w-full resize-none bg-transparent text-[15px] leading-6 text-[#222934] outline-none placeholder:text-[#A1AFC7]"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    onClick={() => openProductContentScreen(selectedProductModel)}
                    className="flex w-full items-center justify-between rounded-[16px] bg-[#F7F9FC] px-4 py-4 text-left"
                  >
                    <div className="text-[14px] font-bold text-[#222934]">Контент</div>
                    <ChevronDown className="-rotate-90 h-4 w-4 text-[#7D8FB3]" />
                  </button>

                  {/* Alternatives section - swipeable + edit mode */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-bold text-[#222934]">
                        Варианты ({selectedProductAlternatives.length})
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedProductAlternatives.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRelatedSectionEditMode(prev => prev === 'alternative' ? null : 'alternative')}
                            className="flex h-11 min-w-[88px] items-center justify-center rounded-[12px] bg-[#F3F6FA] px-4 text-[14px] font-semibold text-[#5A6C8F]"
                          >
                            {relatedSectionEditMode === 'alternative' ? 'Готово' : 'Изменить'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsAddAlternativeMode(true)}
                          className="flex h-11 min-w-[44px] items-center justify-center rounded-[12px] bg-[#EDF5FF] px-3 text-[18px] font-semibold text-[#1D77FF]"
                          aria-label="Добавить вариант"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {selectedProductAlternatives.length > 0 && (
                      <div className="space-y-2">
                        {selectedProductAlternatives.map((alt) => (
                          <div key={alt.id} className="relative overflow-hidden rounded-[12px]">
                            {/* Swipe delete background */}
                            <div className="absolute inset-0 flex items-center justify-end bg-[#FF4D4F] px-4">
                              <span className="text-[15px] font-semibold text-white">Удалить</span>
                            </div>
                            
                            {/* Main item content */}
                            <div
                              className={`relative flex min-h-[56px] items-center gap-3 rounded-[12px] bg-[#F7F9FC] px-4 py-3 transition-transform ${
                                relatedSectionEditMode === 'alternative' ? 'pr-3' : ''
                              }`}
                              style={{
                                touchAction: 'pan-y',
                              }}
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                const startX = touch.clientX;
                                const startTime = Date.now();
                                
                                const handleMove = (moveEvent: TouchEvent) => {
                                  const moveTouch = moveEvent.touches[0];
                                  const deltaX = moveTouch.clientX - startX;
                                  
                                  if (deltaX < 0) {
                                    const clampedDelta = Math.max(deltaX, -80);
                                    target.style.transform = `translateX(${clampedDelta}px)`;
                                  }
                                };
                                
                                const handleEnd = (endEvent: TouchEvent) => {
                                  const endTouch = endEvent.changedTouches[0];
                                  const deltaX = endTouch.clientX - startX;
                                  const deltaTime = Date.now() - startTime;
                                  const velocity = Math.abs(deltaX) / deltaTime;
                                  
                                  if (deltaX < -60 || velocity > 0.5) {
                                    target.style.transform = 'translateX(-80px)';
                                  } else {
                                    target.style.transform = 'translateX(0)';
                                  }
                                  
                                  document.removeEventListener('touchmove', handleMove);
                                  document.removeEventListener('touchend', handleEnd);
                                };
                                
                                document.addEventListener('touchmove', handleMove);
                                document.addEventListener('touchend', handleEnd);
                              }}
                              onClick={(e) => {
                                const target = e.currentTarget;
                                const transform = target.style.transform;
                                
                                if (transform && transform.includes('-80px')) {
                                  target.style.transform = 'translateX(0)';
                                } else if (relatedSectionEditMode !== 'alternative') {
                                  openRelatedItemEditor('alternative', alt);
                                }
                              }}
                            >
                              <span className="min-w-0 flex-1 text-[15px] font-medium text-[#222934] truncate">
                                {alt.name}
                              </span>
                              <span className="flex-shrink-0 text-[15px] font-semibold text-[#222934]">
                                {formatProductMoney(alt.price * alt.quantity * (1 - (alt.discount || 0) / 100))} ₽
                              </span>
                              {relatedSectionEditMode === 'alternative' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Удалить вариант "${alt.name}"?`)) {
                                      unlinkRelatedItem('alternative', alt.id);
                                    }
                                  }}
                                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#FF4D4F] text-[20px] text-[#FF4D4F]"
                                  aria-label="Удалить вариант"
                                >
                                  ⊖
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Addons section - swipeable + edit mode */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-bold text-[#222934]">
                        Дополнения ({selectedProductAddons.length})
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedProductAddons.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRelatedSectionEditMode(prev => prev === 'addon' ? null : 'addon')}
                            className="flex h-11 min-w-[88px] items-center justify-center rounded-[12px] bg-[#F3F6FA] px-4 text-[14px] font-semibold text-[#5A6C8F]"
                          >
                            {relatedSectionEditMode === 'addon' ? 'Готово' : 'Изменить'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsAddAddonMode(true)}
                          className="flex h-11 min-w-[44px] items-center justify-center rounded-[12px] bg-[#EDF5FF] px-3 text-[18px] font-semibold text-[#1D77FF]"
                          aria-label="Добавить дополнение"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {selectedProductAddons.length > 0 && (
                      <div className="space-y-2">
                        {selectedProductAddons.map((addon) => (
                          <div key={addon.id} className="relative overflow-hidden rounded-[12px]">
                            {/* Swipe delete background */}
                            <div className="absolute inset-0 flex items-center justify-end bg-[#FF4D4F] px-4">
                              <span className="text-[15px] font-semibold text-white">Удалить</span>
                            </div>
                            
                            {/* Main item content */}
                            <div
                              className={`relative flex min-h-[56px] items-center gap-3 rounded-[12px] bg-[#F7F9FC] px-4 py-3 transition-transform ${
                                relatedSectionEditMode === 'addon' ? 'pr-3' : ''
                              }`}
                              style={{
                                touchAction: 'pan-y',
                              }}
                              onTouchStart={(e) => {
                                const touch = e.touches[0];
                                const target = e.currentTarget;
                                const startX = touch.clientX;
                                const startTime = Date.now();
                                
                                const handleMove = (moveEvent: TouchEvent) => {
                                  const moveTouch = moveEvent.touches[0];
                                  const deltaX = moveTouch.clientX - startX;
                                  
                                  if (deltaX < 0) {
                                    const clampedDelta = Math.max(deltaX, -80);
                                    target.style.transform = `translateX(${clampedDelta}px)`;
                                  }
                                };
                                
                                const handleEnd = (endEvent: TouchEvent) => {
                                  const endTouch = endEvent.changedTouches[0];
                                  const deltaX = endTouch.clientX - startX;
                                  const deltaTime = Date.now() - startTime;
                                  const velocity = Math.abs(deltaX) / deltaTime;
                                  
                                  if (deltaX < -60 || velocity > 0.5) {
                                    target.style.transform = 'translateX(-80px)';
                                  } else {
                                    target.style.transform = 'translateX(0)';
                                  }
                                  
                                  document.removeEventListener('touchmove', handleMove);
                                  document.removeEventListener('touchend', handleEnd);
                                };
                                
                                document.addEventListener('touchmove', handleMove);
                                document.addEventListener('touchend', handleEnd);
                              }}
                              onClick={(e) => {
                                const target = e.currentTarget;
                                const transform = target.style.transform;
                                
                                if (transform && transform.includes('-80px')) {
                                  target.style.transform = 'translateX(0)';
                                } else if (relatedSectionEditMode !== 'addon') {
                                  openRelatedItemEditor('addon', addon);
                                }
                              }}
                            >
                              <span className="min-w-0 flex-1 text-[15px] font-medium text-[#222934] truncate">
                                {addon.name}
                              </span>
                              <span className="flex-shrink-0 text-[14px] font-semibold text-[#5A6C8F]">
                                + {formatProductMoney(addon.price * addon.quantity * (1 - (addon.discount || 0) / 100))} ₽
                              </span>
                              {relatedSectionEditMode === 'addon' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Удалить дополнение "${addon.name}"?`)) {
                                      unlinkRelatedItem('addon', addon.id);
                                    }
                                  }}
                                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#FF4D4F] text-[20px] text-[#FF4D4F]"
                                  aria-label="Удалить дополнение"
                                >
                                  ⊖
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsMoveToGroupMode(true)}
                      className="flex h-10 w-full items-center justify-center rounded-[14px] bg-[#F3F6FA] px-4 text-[15px] font-medium text-[#5A6C8F]"
                    >
                      Переместить в группу
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(selectedProductModel.id, selectedProduct.groupId)}
                      className="flex h-10 w-full items-center justify-center rounded-[14px] bg-[#FDEEEE] px-4 text-[15px] font-medium text-[#FF4D4F]"
                    >
                      Удалить
                    </button>
                  </div>
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
            {relatedItemEditor?.kind === 'alternative' && selectedRelatedItem && (
              <div className="border-t border-[rgba(13,45,94,0.08)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
                <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 rounded-t-[18px]">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#7D8FB3] transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                    aria-label="Связи альтернативы"
                  >
                    <Link2 className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 text-center">
                    <div className="text-[14px] font-semibold leading-none text-[#7D8FB3]">
                      -{parseDecimalInput(relatedItemDraft.discount || '0').toLocaleString('ru-RU')}%
                    </div>
                    <div className="mt-1 text-[18px] font-bold leading-tight text-[#222934]">
                      {formatProductMoney(
                        parseDecimalInput(relatedItemDraft.price || '0') *
                          (1 - parseDecimalInput(relatedItemDraft.discount || '0') / 100) *
                          parseDecimalInput(relatedItemDraft.quantity || '0')
                      )} ₽
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#7D8FB3] transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                    aria-label="Аналитика альтернативы"
                  >
                    <ChartNoAxesColumn className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            {!isProductDrawerSubscreen && (
              <div className="border-t border-[rgba(13,45,94,0.08)] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
                <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 rounded-t-[18px]">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#7D8FB3] transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                    aria-label="Связи товара"
                  >
                    <Link2 className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 text-center">
                    <div className="text-[14px] font-semibold leading-none text-[#7D8FB3]">
                      -{selectedProductDiscount.toLocaleString('ru-RU')}%
                    </div>
                    <div className="mt-1 text-[18px] font-bold leading-tight text-[#222934]">
                      {formatProductMoney(selectedProductTotal)} ₽
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#7D8FB3] transition-colors hover:bg-[rgba(13,45,94,0.04)]"
                    aria-label="Аналитика товара"
                  >
                    <ChartNoAxesColumn className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </DndProvider>
  );
}
