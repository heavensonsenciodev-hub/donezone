import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface SkeletonArticleProps {
  count?: number; // number of skeletons to show
}

const SkeletonArticle = ({ count = 1 }: SkeletonArticleProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="w-full p-3 bg-pink-200 border rounded-md space-y-2">
          {/* Optional top right icon placeholder */}
          <div className="flex justify-end">
            <Skeleton circle={true} height={20} width={20} />
          </div>
          {/* Main content skeleton */}
          <Skeleton height={16} width="100%" count={2} />
        </div>
      ))}
    </>
  );
};

export default SkeletonArticle;
