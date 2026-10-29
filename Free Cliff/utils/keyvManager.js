const { Keyv } = require('keyv');

class KeyvManager {
	#stores = new Map();

	get(id) {
		if (this.#stores.has(id)) return this.#stores.get(id);

		const store = new Keyv({
			store: new Map(),
			namespace: id,
		});
		store.on('error', err => console.log(`Error on Keyv ${id}`, err));

		this.#stores.set(id, store);
		return store;
	}
}

module.exports = KeyvManager;