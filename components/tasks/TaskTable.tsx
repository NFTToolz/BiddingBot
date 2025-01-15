const getMarketplaceUrls = (slug: string) => ({
  opensea: `https://opensea.io/collection/${slug}`,
  blur: `https://blur.io/collection/${slug}`,
  magiceden: `https://magiceden.io/ethereum/collection/${slug}`,
});

<td className="px-3 py-4 text-center w-[180px]">
  <div className="flex flex-col gap-1">
    <Link
      href={`/dashboard/tasks/${task._id}`}
      className="text-Brand/Brand-1 underline"
    >
      {task.contract.slug}
    </Link>
    <div className="flex gap-2 justify-center text-xs">
      {task.selectedMarketplaces.map((marketplace) => {
        const marketplaceKey = marketplace.toLowerCase();
        const urls = getMarketplaceUrls(task.contract.slug);
        const shortNames = {
          opensea: "OS",
          blur: "Blur",
          magiceden: "ME",
        };

        return (
          <Link
            key={marketplace}
            href={urls[marketplaceKey as keyof typeof urls]}
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:underline ${
              marketplaceKey === "opensea"
                ? "text-[#2081e2]"
                : marketplaceKey === "blur"
                ? "text-[#FF8700]"
                : "text-[#e42575]"
            }`}
          >
            {shortNames[marketplaceKey as keyof typeof shortNames]}
          </Link>
        );
      })}
    </div>
  </div>
</td>;
