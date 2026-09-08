import Image from 'next/image';

export function ExecutiveCard({
  name,
  role,
  bio,
  image,
}: {
  name: string;
  role: string;
  bio: string;
  image: string;
}) {
  return (
    <div className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative h-56 w-full overflow-hidden bg-muted">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          unoptimized
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground">{name}</h3>
        <span className="mt-2 inline-block bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
          {role}
        </span>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
      </div>
    </div>
  );
}
