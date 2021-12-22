/**
 * Act as Array.filter but is keeping the same array reference
 * @param array
 * @param fn
 */
export function filterInPlace<T = any>(array: T[], fn: (item: T) => boolean): void {
    // "from" est l'index qui va parcourir toutes les données actuelles du tableau. Il est incrémenté à chaque boucle et est donc forcément >= à "to".
    // to est l'index de destination du prochain item qui répondra à la fonction de condition
    let from = 0, to = 0;

  while (from < array.length) {
    // Si le filtre est ok avec cet item, il le place dans le tableau et incrémente l'index cible. Sinon, l'index n'est pas incrémenté et sera utilisé pour le prochain item.
    if (fn(array[from])) {
      array[to] = array[from];
      to++;
    }
    from++;
  }
  array.length = to;
}