/// Port that turns a plain-text password into a storable hash. Implemented in
/// infrastructure (e.g. bcrypt); the domain never knows the algorithm.
export interface HashGenerator {
  hash(plain: string): Promise<string>
}
