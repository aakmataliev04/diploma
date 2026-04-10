interface InventoryIconProps {
  className?: string;
}

export const TotalItemsIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M9.16667 18.1083C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1083L16.6667 14.775C16.9198 14.6289 17.13 14.4187 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3333V6.66667C17.4997 6.3744 17.4225 6.08735 17.2763 5.83431C17.13 5.58127 16.9198 5.37114 16.6667 5.225L10.8333 1.89167C10.58 1.74539 10.2926 1.66838 10 1.66838C9.70744 1.66838 9.42003 1.74539 9.16667 1.89167L3.33333 5.225C3.08022 5.37114 2.86998 5.58127 2.72372 5.83431C2.57745 6.08735 2.5003 6.3744 2.5 6.66667V13.3333C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4187 3.08022 14.6289 3.33333 14.775L9.16667 18.1083Z"
      stroke="currentColor"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 18.3333V10" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.74167 5.83333L10 9.99999L17.2583 5.83333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.25 3.55833L13.75 7.85" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LowStockIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M18.3333 14.1667L11.25 7.08333L7.08332 11.25L1.66666 5.83333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.3333 14.1667H18.3333V9.16666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InventoryCostIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 1.66667V18.3333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.1667 4.16667H7.91667C7.14312 4.16667 6.40125 4.47396 5.85427 5.02094C5.30729 5.56792 5 6.30979 5 7.08334C5 7.85689 5.30729 8.59875 5.85427 9.14573C6.40125 9.69271 7.14312 10 7.91667 10H12.0833C12.8569 10 13.5987 10.3073 14.1457 10.8543C14.6927 11.4013 15 12.1431 15 12.9167C15 13.6902 14.6927 14.4321 14.1457 14.9791C13.5987 15.526 12.8569 15.8333 12.0833 15.8333H5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SearchIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M17.5 17.5L13.875 13.875" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.75 15C12.2018 15 15 12.2018 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WarningIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 7.5V10.8333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 14.1667H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.55833 3.35833L1.76667 14.6917C1.62089 14.9442 1.54368 15.2304 1.54272 15.5219C1.54176 15.8134 1.61708 16.1001 1.7612 16.3536C1.90532 16.6071 2.11322 16.8188 2.36407 16.9675C2.61492 17.1162 2.9 17.1968 3.19167 17.2017H16.8083C17.1 17.1968 17.3851 17.1162 17.6359 16.9675C17.8868 16.8188 18.0947 16.6071 18.2388 16.3536C18.3829 16.1001 18.4582 15.8134 18.4573 15.5219C18.4563 15.2304 18.3791 14.9442 18.2333 14.6917L11.4417 3.35833C11.2912 3.113 11.0802 2.91053 10.8287 2.77065C10.5771 2.63077 10.294 2.55823 10.0062 2.56003C9.71842 2.56183 9.43626 2.63791 9.18648 2.78092C8.93669 2.92392 8.72823 3.129 8.58083 3.37667L8.55833 3.35833Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InventoryFallbackIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 16C11 16 13 8 18 8C19.0609 8 20.0783 8.42143 20.8284 9.17157C21.5786 9.92172 22 10.9391 22 12C22 13.0609 21.5786 14.0783 20.8284 14.8284C20.0783 15.5786 19.0609 16 18 16C13 16 11 8 6 8C4.93913 8 3.92172 8.42143 3.17157 9.17157C2.42143 9.92172 2 10.9391 2 12C2 13.0609 2.42143 14.0783 3.17157 14.8284C3.92172 15.5786 4.93913 16 6 16Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EditIcon = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.25 1.75003C12.5152 1.48481 12.8749 1.33582 13.25 1.33582C13.6251 1.33582 13.9848 1.48481 14.25 1.75003C14.5152 2.01525 14.6642 2.37496 14.6642 2.75003C14.6642 3.1251 14.5152 3.48481 14.25 3.75003L8.24133 9.75936C8.08302 9.91753 7.88746 10.0333 7.67266 10.096L5.75732 10.656C5.69996 10.6728 5.63915 10.6738 5.58126 10.6589C5.52338 10.6441 5.47054 10.614 5.42829 10.5717C5.38604 10.5295 5.35592 10.4766 5.34109 10.4188C5.32626 10.3609 5.32726 10.3001 5.34399 10.2427L5.90399 8.32736C5.96701 8.11273 6.08301 7.9174 6.24132 7.75936L12.25 1.75003Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIconForModal = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ImageInputIconForModal = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.00002 7.33341C6.7364 7.33341 7.33335 6.73646 7.33335 6.00008C7.33335 5.2637 6.7364 4.66675 6.00002 4.66675C5.26364 4.66675 4.66669 5.2637 4.66669 6.00008C4.66669 6.73646 5.26364 7.33341 6.00002 7.33341Z" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 9.99996L11.9427 7.94263C11.6926 7.69267 11.3536 7.55225 11 7.55225C10.6464 7.55225 10.3074 7.69267 10.0573 7.94263L4 14" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIconForModal = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true">
    <path d="M11.3334 0.666504L4.00002 7.99984L0.666687 4.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIconForRestockModal = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIconForRestockModal = ({ className }: InventoryIconProps) => (
  <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true">
    <path d="M11.3334 0.666504L4.00002 7.99984L0.666687 4.6665" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
