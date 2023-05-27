# zod-electron-store

The same of electron store, but with zod as validador

## How to Use

```ts
import ZodElectronStore from "zod-electron-store"
import {z} from "zod"

const zodSchema = z.object({
	foo: z.string().default("bar")
})

type DataType = z.infer<typeof zodSchema>

const data = new ZodElectronStore<DataType>({
	//...Other configs
	schema: zodSchema
})
```

## Know issues

Zod does not have support to `uniqueItems` in arrays.

## Credits

All rigths reserved to [sindresorhus](https://github.com/sindresorhus), owner of the original electron-store.