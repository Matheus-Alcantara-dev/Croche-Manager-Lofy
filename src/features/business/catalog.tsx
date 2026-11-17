import { useCallback, useState } from 'react';
import { Page } from '@/components/layout';
import { Photo, PhotoEditor } from '@/components/photos';
import { DataState, Resource } from '@/components/resource';
import { Button, Copy, Row } from '@/components/ui';
import { localOwner } from '@/local/seed';
import { useData } from '@/hooks/use-data';
import { choices, ownList, remove, save } from '@/services/store';
import { money } from '@/utils/format';
import { amount, description, nameField, reference } from './fields';

export default function CatalogAdmin() {
  const [categories, setCategories] = useState(false);
  const owner = localOwner;
  const query = useCallback(async () => {
    const [products, categories] = await Promise.all([ownList('products', owner), ownList('product_categories', owner)]);
    return { products, categories };
  }, [owner]);
  const state = useData(query);
  const data = state.data;
  return <Page>
    <Row>
      <Button label="Produtos" secondary={categories} onPress={() => setCategories(false)} />
      <Button label="Categorias" secondary={!categories} onPress={() => setCategories(true)} />
    </Row>
    <DataState {...state} retry={state.reload} />
    {data && (categories ? <Resource key="categories" title="Categorias" singular="categoria" rows={data.categories}
      fields={[{ ...nameField, max: 80 }]} label={(row) => row.name}
      save={(values, row) => save('product_categories', owner, values, row)}
      remove={(row) => remove('product_categories', owner, row)} refresh={state.reload} />
      : <Resource grid key="products" title="Produtos e preços" singular="produto" rows={data.products}
        fields={[{ ...nameField, label: 'Nome do produto' }, description,
          reference('category_id', 'Categoria', choices(data.categories)),
          amount('price', 'Preço em R$ (vazio para orçamento)'),
          { key: 'published', label: 'Exibir na vitrine', type: 'boolean' },
          { key: 'featured', label: 'Destacar na página inicial', type: 'boolean' },
          { key: 'available', label: 'Aceitar encomendas', type: 'boolean', default: 'true' }]}
        label={(row) => row.name} searchText={(row) => row.description}
        summary={(row) => <>
          <Copy muted>{row.price == null ? 'Orçamento sob consulta' : money(row.price)} · {row.published ? 'Publicado' : 'Oculto'}</Copy>
          {!!row.photos[0] && <Photo compact path={row.photos[0]} label={row.name} />}
        </>}
        details={(row) => <PhotoEditor paths={row.photos}
          update={async (photos) => { await save('products', owner, { photos }, row); state.reload(); }} />}
        save={(values, row) => save('products', owner, { ...values, description: values.description ?? '' }, row)}
        remove={(row) => remove('products', owner, row)} refresh={state.reload} />)}
  </Page>;
}
