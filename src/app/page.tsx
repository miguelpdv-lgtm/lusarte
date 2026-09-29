import { Categories } from "@/components/home/Categories";
import { Faq } from "@/components/home/Faq";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { IntroLight } from "@/components/home/IntroLight";
import { SeasonBanner } from "@/components/home/SeasonBanner";
import { StepsGuide } from "@/components/home/StepsGuide";
import { Story } from "@/components/home/Story";

export default function Home() {
  return (
    <>
      <Hero />
      <IntroLight />
      <Categories />
      <SeasonBanner />
      <FeaturedProducts />
      <Story />
      <StepsGuide />
      <Faq />
    </>
  );
}
