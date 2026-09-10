import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  page: number;
  pageCount: number;
  busy?: boolean;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  pageCount,
  busy = false,
  onPageChange,
}: TablePaginationProps) {
  const prevDisabled = busy || page === 0;
  const nextDisabled = busy || page >= pageCount - 1;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Попередня"
            tabIndex={prevDisabled ? -1 : 0}
            className={prevDisabled ? "pointer-events-none opacity-20" : ""}
            onClick={(e) => {
              e.preventDefault();
              if (!prevDisabled) {
                onPageChange(page - 1);
              }
            }}
          />
        </PaginationItem>

        <PaginationItem>
          <span className="px-3 text-sm" role="status">
            Сторінка {page + 1} з {pageCount}
          </span>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            href="#"
            text="Наступна"
            tabIndex={nextDisabled ? -1 : 0}
            className={nextDisabled ? "pointer-events-none opacity-20" : ""}
            onClick={(e) => {
              e.preventDefault();
              if (!nextDisabled) {
                onPageChange(page + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
