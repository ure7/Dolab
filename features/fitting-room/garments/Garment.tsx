import type { CategoryId } from "@/config/dolab.config";
import type { GarmentProps } from "./fabric";
import { Tee } from "./Tee";
import { Hoodie } from "./Hoodie";
import { Jacket } from "./Jacket";
import { Trousers } from "./Trousers";
import { Shoes } from "./Shoes";
import { Bag } from "./Bag";

const garmentByCategory: Record<CategoryId, (props: GarmentProps) => React.ReactElement> = {
  inner_top: Tee,
  hoodie: Hoodie,
  outer_layer: Jacket,
  bottoms: Trousers,
  shoes: Shoes,
  accessory: Bag,
};

// Draws the right garment for a category. Want a different look for a
// category? Make a new garment component and swap it in the map above.
export function Garment({ category, ...props }: GarmentProps & { category: CategoryId }) {
  const Component = garmentByCategory[category];
  return <Component {...props} />;
}
