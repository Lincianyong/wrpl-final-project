import {IProductItem} from "boundless-api-client";
import {apiClient, nativeFetch, revalidate} from "@/lib/api";
import {notFound} from 'next/navigation'
import {fetchBasicSettings} from "@/lib/settings";
import {ProductLabels, ProductAttrs} from 'boundless-commerce-components'
import AddToCart from "@/components/product/addToCart";
import Link from 'next/link'
import VariantPicker from "@/components/product/variantPicker";
import PriceAndSku from "@/components/product/priceAndSku";
import ProductGalleryWrapper from "@/components/productGalleryWrapper";
import type { Metadata, ResolvingMetadata } from 'next'

export default async function ProductPage({params: {slug}}: IProps) {
	const product = await fetchProductBySlug(slug);
	const settings = await fetchBasicSettings();

	if (!product) {
		return notFound();
	}

	return (
		<>
			<div className={'container-fluid'}>
				<h1>{product.title}</h1>
				{product.labels && <ProductLabels labels={product.labels} className={'mb-4'}/>}

				<div className={'row'}>
					<div className={'col-md-7'}>
						<ProductGalleryWrapper product={product} />
					</div>
					<div className={'col-md-5'}>
						<div className={'bg-light p-3 mb-4'}>
							{product.has_variants && <VariantPicker product={product} settings={settings}/>}
							{!product.has_variants && <>
								<PriceAndSku product={product} settings={settings} />
								<AddToCart
									itemId={product.item_id}
									disabled={!product.in_stock}
								/>
							</>}
						</div>
						<ProductAttrs
							characteristics={product.attributes}
							manufacturer={product.manufacturer}
							size={product.props.size}
							className={'p-3 bg-light'}
							apiClient={apiClient}
						/>
					</div>
				</div>
				{product.text.description &&
					<article
						dangerouslySetInnerHTML={{__html: product.text.description}}
						className={'mb-4'}
						style={{maxWidth: '800px'}}
					/>
				}
			</div>
		</>
	);
}

export async function generateMetadata({params: {slug}}: IProps, parent: ResolvingMetadata): Promise<Metadata> {
	const product = await fetchProductBySlug(slug);

	return {
		title: product?.seo.title,
		description: product?.seo.metaDesc
	};
}

const fetchProductBySlug = async (slug: string): Promise<IProductItem|undefined> => {
	const data = await nativeFetch(`/catalog/products/item/${slug}?only_published=1`, {
		next: {
			revalidate,
			tags: ['products', 'product']
		}
	});
	if (!data.ok) {
		if (data.status === 404) {
			return;
		} else {
			throw new Error(`Failed to fetch product: ${slug}`)
		}
	}

	return data.json();
};

interface IProps {params: {slug: string}};
